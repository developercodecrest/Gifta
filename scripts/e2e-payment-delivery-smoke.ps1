param(
  [string]$BaseUrl = "http://localhost:3010",
  [string]$PinCode = "400001",
  [string]$AuthToken = "",
  [string]$FullName = "Gifta Test User",
  [string]$Email = "test@gifta.local",
  [string]$Phone = "9999999999",
  [string]$Line1 = "Test Address Line",
  [string]$City = "Mumbai",
  [string]$State = "Maharashtra",
  [string]$AddressLabel = "Home",
  [string]$RazorpayWebhookSecret = "",
  [string]$DelhiveryWebhookSecret = "",
  [switch]$SkipCod,
  [switch]$SkipRazorpay,
  [switch]$SkipRazorpayWebhook,
  [switch]$SkipDelhiveryWebhook
)

$ErrorActionPreference = "Stop"

function Write-Section([string]$Message) {
  Write-Host ""
  Write-Host "==== $Message ====" -ForegroundColor Cyan
}

function Get-HmacSha256Hex([string]$Secret, [string]$Data) {
  $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($Secret))
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Data)
  $hash = $hmac.ComputeHash($bytes)
  ($hash | ForEach-Object { $_.ToString("x2") }) -join ""
}

function Invoke-JsonApi {
  param(
    [Parameter(Mandatory = $true)][ValidateSet("GET", "POST", "PATCH", "DELETE")][string]$Method,
    [Parameter(Mandatory = $true)][string]$Url,
    [hashtable]$Headers,
    [object]$Body
  )

  $requestHeaders = @{
    Accept = "application/json"
  }
  if ($Headers) {
    foreach ($key in $Headers.Keys) {
      $requestHeaders[$key] = $Headers[$key]
    }
  }

  $bodyJson = $null
  if ($PSBoundParameters.ContainsKey("Body") -and $null -ne $Body) {
    $bodyJson = ($Body | ConvertTo-Json -Depth 20 -Compress)
    $requestHeaders["Content-Type"] = "application/json"
  }

  try {
    if ($null -ne $bodyJson) {
      return Invoke-RestMethod -Method $Method -Uri $Url -Headers $requestHeaders -Body $bodyJson
    }
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $requestHeaders
  } catch {
    if ($_.Exception.Response) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $reader.ReadToEnd()
      try {
        return ($raw | ConvertFrom-Json)
      } catch {
        throw "HTTP error from $Url : $raw"
      }
    }
    throw
  }
}

$normalizedBase = $BaseUrl.TrimEnd("/")
$authHeaders = @{}
if ($AuthToken.Trim()) {
  $authHeaders["Authorization"] = "Bearer $AuthToken"
}

$summary = [ordered]@{
  serviceability = $null
  codOrderRef = $null
  razorpayOrderRef = $null
  razorpayOrderId = $null
  razorpayWebhook = $null
  delhiveryWebhook = @()
}

Write-Section "1) Delhivery pincode serviceability"
$serviceability = Invoke-JsonApi -Method GET -Url "$normalizedBase/api/shipping/delhivery/serviceability?pinCode=$([Uri]::EscapeDataString($PinCode))"
$summary.serviceability = $serviceability

if (-not $serviceability.success) {
  throw "Serviceability API failed: $($serviceability.error.message)"
}

$serviceableFlag = [bool]$serviceability.data.serviceable
Write-Host "Serviceable: $serviceableFlag | Remark: $($serviceability.data.remark)"

if (-not $serviceableFlag) {
  throw "Pincode is not serviceable, stopping flow."
}

if (-not $AuthToken.Trim()) {
  Write-Section "Auth token not provided"
  Write-Host "Provide -AuthToken to continue with COD/Razorpay order creation and webhook sequence."
  Write-Host ""
  Write-Host "Current summary:" -ForegroundColor Yellow
  $summary | ConvertTo-Json -Depth 20
  exit 0
}

$customer = @{
  fullName = $FullName
  email = $Email
  phone = $Phone
  line1 = $Line1
  city = $City
  state = $State
  pinCode = $PinCode
  addressLabel = $AddressLabel
}

if (-not $SkipCod) {
  Write-Section "2) COD order placement"
  $codPayload = Invoke-JsonApi -Method POST -Url "$normalizedBase/api/checkout/place" -Headers $authHeaders -Body @{
    paymentMethod = "cod"
    customer = $customer
  }

  if (-not $codPayload.success) {
    throw "COD order failed: $($codPayload.error.message)"
  }

  $summary.codOrderRef = $codPayload.data.orderId
  Write-Host "COD orderRef: $($summary.codOrderRef)"
}

if (-not $SkipRazorpay) {
  Write-Section "3) Razorpay order creation"
  $rzpPayload = Invoke-JsonApi -Method POST -Url "$normalizedBase/api/checkout/razorpay/order" -Headers $authHeaders -Body @{
    customer = $customer
  }

  if (-not $rzpPayload.success) {
    throw "Razorpay order create failed: $($rzpPayload.error.message)"
  }

  $summary.razorpayOrderRef = $rzpPayload.data.orderRef
  $summary.razorpayOrderId = $rzpPayload.data.razorpayOrderId
  Write-Host "Razorpay orderRef: $($summary.razorpayOrderRef)"
  Write-Host "Razorpay orderId: $($summary.razorpayOrderId)"

  if (-not $SkipRazorpayWebhook) {
    Write-Section "4) Simulate Razorpay success webhook"

    if (-not $RazorpayWebhookSecret.Trim()) {
      Write-Host "Skipped Razorpay webhook: -RazorpayWebhookSecret not provided." -ForegroundColor Yellow
    } else {
      $paymentId = "pay_test_" + [Guid]::NewGuid().ToString("N").Substring(0, 12)
      $rzpWebhookBodyObj = @{
        event = "payment.captured"
        payload = @{
          payment = @{
            entity = @{
              id = $paymentId
              order_id = $summary.razorpayOrderId
              status = "captured"
            }
          }
        }
      }
      $rzpWebhookBody = ($rzpWebhookBodyObj | ConvertTo-Json -Depth 20 -Compress)
      $rzpSig = Get-HmacSha256Hex -Secret $RazorpayWebhookSecret -Data $rzpWebhookBody

      $rzpWebhook = Invoke-JsonApi -Method POST -Url "$normalizedBase/api/checkout/razorpay/webhook" -Headers @{
        "x-razorpay-signature" = $rzpSig
        "Content-Type" = "application/json"
      } -Body $rzpWebhookBodyObj

      $summary.razorpayWebhook = $rzpWebhook
      if (-not $rzpWebhook.success) {
        throw "Razorpay webhook simulation failed: $($rzpWebhook.error.message)"
      }
      Write-Host "Razorpay webhook matched: $($rzpWebhook.data.matchedCount), modified: $($rzpWebhook.data.modifiedCount)"
    }
  }
}

if (-not $SkipDelhiveryWebhook) {
  Write-Section "5) Simulate Delhivery webhook updates"

  $targetRef = if ($summary.razorpayOrderRef) { $summary.razorpayOrderRef } elseif ($summary.codOrderRef) { $summary.codOrderRef } else { "" }
  if (-not $targetRef) {
    Write-Host "Skipped Delhivery webhook: no orderRef available." -ForegroundColor Yellow
  } else {
    $events = @(
      @{ status = "In Transit"; order = $targetRef; waybill = "WB" + (Get-Random -Minimum 100000 -Maximum 999999) },
      @{ status = "Out For Delivery"; order = $targetRef; waybill = "WB" + (Get-Random -Minimum 100000 -Maximum 999999) },
      @{ status = "Delivered"; order = $targetRef; waybill = "WB" + (Get-Random -Minimum 100000 -Maximum 999999) }
    )

    foreach ($eventPayload in $events) {
      if ($DelhiveryWebhookSecret.Trim()) {
        $raw = ($eventPayload | ConvertTo-Json -Depth 10 -Compress)
        $sig = Get-HmacSha256Hex -Secret $DelhiveryWebhookSecret -Data $raw
        $eventResp = Invoke-JsonApi -Method POST -Url "$normalizedBase/api/shipping/delhivery/webhook" -Headers @{
          "x-delhivery-signature" = $sig
          "Content-Type" = "application/json"
        } -Body $eventPayload
        $summary.delhiveryWebhook += $eventResp
        if (-not $eventResp.success) {
          throw "Delhivery webhook simulation failed: $($eventResp.error.message)"
        }
        Write-Host "Delhivery webhook '$($eventPayload.status)' matched: $($eventResp.data.matchedCount), modified: $($eventResp.data.modifiedCount)"
      } else {
        $eventResp = Invoke-JsonApi -Method POST -Url "$normalizedBase/api/shipping/delhivery/webhook" -Headers @{
          "Content-Type" = "application/json"
        } -Body $eventPayload
        $summary.delhiveryWebhook += $eventResp
        if (-not $eventResp.success) {
          throw "Delhivery webhook simulation failed: $($eventResp.error.message)"
        }
        Write-Host "Delhivery webhook '$($eventPayload.status)' matched: $($eventResp.data.matchedCount), modified: $($eventResp.data.modifiedCount)"
      }
    }
  }
}

Write-Section "Flow complete"
$summary | ConvertTo-Json -Depth 20
