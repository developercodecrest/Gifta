"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Plus, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

type OtpRequestPayload = {
  success?: boolean;
  data?: { message?: string; sendsLeft?: number };
  error?: { message?: string; details?: { retryAfterMs?: number; sendsLeft?: number } };
};

type MobileSignInPayload = {
  success?: boolean;
  data?: {
    user?: {
      id: string;
      email: string;
      fullname?: string;
      phone?: string;
      role?: string;
      token?: string;
    };
  };
  error?: { message?: string };
};

type AccountExistsPayload = {
  success?: boolean;
  data?: { exists?: boolean };
};

type ApiResponsePayload = {
  success?: boolean;
  error?: { message?: string };
};

function sanitizeCallbackPath(value: string | null): string {
  if (!value) {
    return "/";
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.origin === "https://gifta.in" || parsed.origin === window.location.origin) {
      const candidate = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return candidate.startsWith("/") ? candidate : "/";
    }
  } catch {
    return "/";
  }

  return "/";
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return "";
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-2 text-sm text-muted-foreground">Loading sign-in...</div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => sanitizeCallbackPath(searchParams.get("callbackUrl")), [searchParams]);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"email" | "mobile">("email");
  const [otp, setOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [requestingMobileOtp, setRequestingMobileOtp] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signingInMobile, setSigningInMobile] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [otpMeta, setOtpMeta] = useState<string | null>(null);
  const [mobileOtpMeta, setMobileOtpMeta] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [emailAccountExists, setEmailAccountExists] = useState<boolean>(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFinalizingAuth, setIsFinalizingAuth] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileReceiverName, setProfileReceiverName] = useState("");
  const [profileReceiverPhones, setProfileReceiverPhones] = useState<string[]>([""]);
  const [profileLine1, setProfileLine1] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileState, setProfileState] = useState("");
  const [profilePinCode, setProfilePinCode] = useState("");
  const [profileCountry, setProfileCountry] = useState("India");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [postAuthPath, setPostAuthPath] = useState<string>(callbackUrl);

  const requestOtp = async (payload: { email?: string; phone?: string }) => {
    const response = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => ({}))) as OtpRequestPayload;
    return { response, result };
  };

  const hasExistingAccount = async (payload: { email?: string; phone?: string }) => {
    const query = payload.email
      ? `email=${encodeURIComponent(payload.email)}`
      : `phone=${encodeURIComponent(payload.phone ?? "")}`;
    const response = await fetch(`/api/auth/account/exists?${query}`);
    const result = (await response.json().catch(() => ({}))) as AccountExistsPayload;
    return Boolean(response.ok && result.success && result.data?.exists);
  };

  const goToAuthenticatedPath = (nextPath?: string) => {
    const target = sanitizeCallbackPath(nextPath ?? callbackUrl) || callbackUrl;
    setIsFinalizingAuth(true);
    window.location.assign(target);
  };

  const updateReceiverPhone = (index: number, value: string) => {
    setProfileReceiverPhones((prev) => prev.map((entry, i) => (i === index ? value : entry)));
  };

  const addReceiverPhone = () => {
    setProfileReceiverPhones((prev) => [...prev, ""]);
  };

  const removeReceiverPhone = (index: number) => {
    setProfileReceiverPhones((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const onRequestOtp = async () => {
    setError(null);
    setStatus(null);
    setOtpMeta(null);
    setEmailWarning(null);
    setOtpSent(false);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setRequestingOtp(true);
      const accountExists = await hasExistingAccount({ email: normalizedEmail });
      setEmailAccountExists(accountExists);

      const { response, result: payload } = await requestOtp({ email: normalizedEmail });

      if (!response.ok || !payload.success) {
        if (response.status === 429 && payload.error?.details?.retryAfterMs) {
          const waitMinutes = Math.ceil(payload.error.details.retryAfterMs / 60000);
          setOtpMeta(`You have reached OTP limit. Try again in ${waitMinutes} minute(s).`);
        }
        setError(payload.error?.message ?? "Unable to send OTP.");
        return;
      }

      setStatus(payload.data?.message ?? "OTP sent. Check your email inbox.");
      setOtpSent(true);
      if (!accountExists) {
        setEmailWarning("No account found for this email. We will create your account after OTP verification.");
      }
      if (typeof payload.data?.sendsLeft === "number") {
        setOtpMeta(`OTP sends left this hour: ${payload.data.sendsLeft}`);
      }
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const onRequestMobileOtp = async () => {
    setMobileError(null);
    setMobileStatus(null);
    setMobileOtpMeta(null);
    setMobileOtpSent(false);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setRequestingMobileOtp(true);
      const { response, result: payload } = await requestOtp({ phone: normalizedPhone });

      if (!response.ok || !payload.success) {
        if (response.status === 429 && payload.error?.details?.retryAfterMs) {
          const waitMinutes = Math.ceil(payload.error.details.retryAfterMs / 60000);
          setMobileOtpMeta(`You have reached OTP limit. Try again in ${waitMinutes} minute(s).`);
        }
        setMobileError(payload.error?.message ?? "Unable to send OTP.");
        return;
      }

      setMobileStatus(payload.data?.message ?? "OTP sent successfully.");
      setMobileOtpSent(true);
      if (typeof payload.data?.sendsLeft === "number") {
        setMobileOtpMeta(`OTP sends left this hour: ${payload.data.sendsLeft}`);
      }
    } catch {
      setMobileError("Unable to send OTP right now. Please try again.");
    } finally {
      setRequestingMobileOtp(false);
    }
  };

  const finishTokenSignIn = async (
    user: NonNullable<NonNullable<MobileSignInPayload["data"]>["user"]>,
    options?: { redirectNow?: boolean },
  ) => {
    const result = await signIn("credentials", {
      id: user.id,
      email: user.email,
      fullname: user.fullname ?? "",
      phone: user.phone ?? "",
      role: user.role ?? "USER",
      token: user.token,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      return { ok: false as const };
    }

    const nextPath = sanitizeCallbackPath(result.url) || callbackUrl;
    if (options?.redirectNow !== false) {
      goToAuthenticatedPath(nextPath);
    }

    return { ok: true as const, nextPath };
  };

  const saveProfileAndContinue = async () => {
    setProfileError(null);

    const fullName = profileName.trim();
    const phone = normalizePhone(profilePhone);
    const receiverName = profileReceiverName.trim();
    const normalizedReceiverPhones = profileReceiverPhones.map((value) => normalizePhone(value));
    const validReceiverPhones = normalizedReceiverPhones.filter((value) => Boolean(value));
    const line1 = profileLine1.trim();
    const city = profileCity.trim();
    const state = profileState.trim();
    const pinCode = profilePinCode.trim();
    const country = profileCountry.trim();

    if (fullName.length < 2) {
      setProfileError("Please enter full name.");
      return;
    }
    if (!phone) {
      setProfileError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (receiverName.length < 2) {
      setProfileError("Please enter receiver name.");
      return;
    }
    if (normalizedReceiverPhones.some((value, index) => profileReceiverPhones[index].trim().length > 0 && !value)) {
      setProfileError("Please enter valid 10-digit receiver phone numbers.");
      return;
    }
    if (!validReceiverPhones.length) {
      setProfileError("At least one receiver phone is required.");
      return;
    }
    if (!line1 || !city || !state || !pinCode || !country) {
      setProfileError("Please complete all address fields.");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
          addresses: [
            {
              label: "Primary",
              receiverName,
              receiverPhone: validReceiverPhones[0],
              receiverPhones: validReceiverPhones,
              line1,
              city,
              state,
              pinCode,
              country,
            },
          ],
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponsePayload;
      if (!response.ok || payload.success === false) {
        setProfileError(payload.error?.message ?? "Unable to save your details. Please try again.");
        return;
      }

      setProfileDialogOpen(false);
      goToAuthenticatedPath(postAuthPath);
    } catch {
      setProfileError("Unable to save your details. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const resetEmailOtpFlow = () => {
    setOtpSent(false);
    setOtp("");
    setStatus(null);
    setError(null);
    setOtpMeta(null);
    setEmailWarning(null);
  };

  const resetMobileOtpFlow = () => {
    setMobileOtpSent(false);
    setMobileOtp("");
    setMobileStatus(null);
    setMobileError(null);
    setMobileOtpMeta(null);
  };

  const onOtpSignIn = async () => {
    setError(null);
    setStatus(null);

    if (!email.trim() || !otp.trim()) {
      setError("Email and OTP are required.");
      return;
    }

    try {
      setSigningIn(true);
      const intent = emailAccountExists ? "signin" : "signup";
      const response = await fetch("/api/auth/mobile/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          intent,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as MobileSignInPayload;
      const authUser = payload.data?.user;
      if (!response.ok || !payload.success || !authUser?.id || !authUser?.token) {
        setError(payload.error?.message ?? "Invalid or expired OTP.");
        return;
      }

      const authResult = await finishTokenSignIn(authUser, { redirectNow: intent === "signin" });
      if (!authResult.ok) {
        setError("Authentication failed. Please try again.");
        return;
      }

      if (intent === "signup") {
        setPostAuthPath(authResult.nextPath ?? callbackUrl);
        const resolvedName = authUser.fullname?.trim() || email.split("@")[0] || "";
        const resolvedPhone = authUser.phone ?? "";
        setProfileName(resolvedName);
        setProfilePhone(authUser.phone ?? "");
        setProfileReceiverName(resolvedName);
        setProfileReceiverPhones([resolvedPhone || ""]);
        setProfileLine1("");
        setProfileCity("");
        setProfileState("");
        setProfilePinCode("");
        setProfileCountry("India");
        setProfileError(null);
        setProfileDialogOpen(true);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const onMobileOtpSignIn = async () => {
    setMobileError(null);
    setMobileStatus(null);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !mobileOtp.trim()) {
      setMobileError("Mobile number and OTP are required.");
      return;
    }

    try {
      setSigningInMobile(true);

      const existsRes = await fetch(`/api/auth/account/exists?phone=${encodeURIComponent(normalizedPhone)}`);
      const existsPayload = (await existsRes.json().catch(() => ({}))) as AccountExistsPayload;
      const accountExists = Boolean(existsRes.ok && existsPayload.success && existsPayload.data?.exists);

      if (!accountExists) {
        setMobileError("No account found for this phone number. Please sign up first.");
        return;
      }

      const response = await fetch("/api/auth/mobile/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: mobileOtp,
          intent: "signin",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as MobileSignInPayload;
      const authUser = payload.data?.user;
      if (!response.ok || !payload.success || !authUser?.id || !authUser?.token) {
        setMobileError(payload.error?.message ?? "Invalid or expired OTP.");
        return;
      }

      const authResult = await finishTokenSignIn(authUser);
      if (!authResult.ok) {
        setMobileError("Authentication failed. Please try again.");
      }
    } finally {
      setSigningInMobile(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
        <p className="mt-1 text-sm text-[#5f5047]">Continue with OTP or Google for your Gifta account.</p>
      </div>

      <div className="space-y-4">
        <div className="grid w-full grid-cols-2 gap-2 rounded-lg border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "email" ? "bg-primary text-primary-foreground" : "text-[#5f5047] hover:bg-accent"
            }`}
          >
            <Mail className="h-4 w-4" /> Email OTP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mobile")}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition ${
              activeTab === "mobile" ? "bg-primary text-primary-foreground" : "text-[#5f5047] hover:bg-accent"
            }`}
          >
            <Smartphone className="h-4 w-4" /> Mobile OTP
          </button>
        </div>

        {activeTab === "email" ? (
          <div className="space-y-4 rounded-lg border border-border p-4">
          <Field label="Email">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (otpSent) {
                  resetEmailOtpFlow();
                }
              }}
            />
          </Field>

          <Button type="button" className="w-full" onClick={onRequestOtp} disabled={requestingOtp}>
            {requestingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {requestingOtp ? "Sending OTP..." : "Send OTP"}
          </Button>

          {otpSent ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#5f5047]">Enter the 6-digit code sent to {email}.</p>
                <button type="button" className="text-sm font-medium text-primary" onClick={resetEmailOtpFlow}>
                  Change email
                </button>
              </div>

              <Field label="Enter OTP">
                <InputOTP value={otp} onChange={setOtp} maxLength={6} />
              </Field>

              <Button type="button" className="w-full" onClick={onOtpSignIn} disabled={signingIn}>
                {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {signingIn ? "Verifying..." : "Verify OTP & Sign in"}
              </Button>
            </>
          ) : null}

          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {emailWarning ? <p className="text-sm text-amber-700">{emailWarning}</p> : null}
          {otpMeta ? <p className="text-sm text-[#5f5047]">{otpMeta}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {activeTab === "mobile" ? (
          <div className="space-y-4 rounded-lg border border-border p-4">
          <Field label="Mobile Number">
            <Input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (mobileOtpSent) {
                  resetMobileOtpFlow();
                }
              }}
            />
          </Field>

          <p className="text-xs text-[#5f5047]">For security, OTP is delivered to the email linked with this phone number.</p>

          <Button type="button" className="w-full" onClick={onRequestMobileOtp} disabled={requestingMobileOtp}>
            {requestingMobileOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {requestingMobileOtp ? "Sending OTP..." : "Send OTP"}
          </Button>

          {mobileOtpSent ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#5f5047]">Enter the 6-digit code sent for {phone}.</p>
                <button type="button" className="text-sm font-medium text-primary" onClick={resetMobileOtpFlow}>
                  Change email
                </button>
              </div>

              <Field label="Enter OTP">
                <InputOTP value={mobileOtp} onChange={setMobileOtp} maxLength={6} />
              </Field>

              <Button type="button" className="w-full" onClick={onMobileOtpSignIn} disabled={signingInMobile}>
                {signingInMobile ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {signingInMobile ? "Verifying..." : "Verify OTP & Sign in"}
              </Button>
            </>
          ) : null}

          {mobileStatus ? <p className="text-sm text-emerald-600">{mobileStatus}</p> : null}
          {mobileOtpMeta ? <p className="text-sm text-[#5f5047]">{mobileOtpMeta}</p> : null}
          {mobileError ? <p className="text-sm text-destructive">{mobileError}</p> : null}
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        className="w-full"
        variant="secondary"
        onClick={() => {
          setIsGoogleLoading(true);
          setIsFinalizingAuth(true);
          signIn("google", { callbackUrl });
        }}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
      </Button>

      {isFinalizingAuth ? <p className="text-sm text-[#5f5047]">Setting up profile...</p> : null}

      <div className="flex items-center justify-end text-sm">
        <Link href="/auth/sign-up" className="font-medium text-primary">
          Create account
        </Link>
      </div>

      <Dialog
        open={profileDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!savingProfile) {
              setProfileError("Please complete your profile to continue.");
            }
            return;
          }
          setProfileDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete your profile</DialogTitle>
            <DialogDescription>
              Please add full profile and delivery address details to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full Name">
              <Input
                type="text"
                placeholder="Your full name"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={profilePhone}
                onChange={(event) => setProfilePhone(event.target.value)}
              />
            </Field>

            <div className="sm:col-span-2 rounded-lg border border-border bg-card p-4 shadow-sm">
              <p className="mb-3 text-sm font-medium text-foreground">Address details</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Receiver Name">
                  <Input
                    type="text"
                    placeholder="Receiver full name"
                    value={profileReceiverName}
                    onChange={(event) => setProfileReceiverName(event.target.value)}
                  />
                </Field>

                <div className="space-y-2">
                  <Label className="block text-sm">Receiver Phone(s)</Label>
                  {profileReceiverPhones.map((entry, index) => (
                    <div key={`receiver-phone-${index}`} className="flex items-center gap-2">
                      <Input
                        type="tel"
                        placeholder="10-digit receiver phone"
                        value={entry}
                        onChange={(event) => updateReceiverPhone(index, event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeReceiverPhone(index)}
                        disabled={profileReceiverPhones.length === 1}
                        aria-label="Delete receiver phone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addReceiverPhone}>
                    <Plus className="h-4 w-4" />
                    Add phone
                  </Button>
                </div>

                <Field label="Address Line 1">
                  <Input
                    type="text"
                    placeholder="House/Flat, Street"
                    value={profileLine1}
                    onChange={(event) => setProfileLine1(event.target.value)}
                  />
                </Field>

                <Field label="City">
                  <Input
                    type="text"
                    placeholder="City"
                    value={profileCity}
                    onChange={(event) => setProfileCity(event.target.value)}
                  />
                </Field>

                <Field label="State">
                  <Input
                    type="text"
                    placeholder="State"
                    value={profileState}
                    onChange={(event) => setProfileState(event.target.value)}
                  />
                </Field>

                <Field label="PIN Code">
                  <Input
                    type="text"
                    placeholder="PIN code"
                    value={profilePinCode}
                    onChange={(event) => setProfilePinCode(event.target.value)}
                  />
                </Field>

                <Field label="Country">
                  <Input
                    type="text"
                    placeholder="Country"
                    value={profileCountry}
                    onChange={(event) => setProfileCountry(event.target.value)}
                  />
                </Field>
              </div>
            </div>

            {profileError ? <p className="sm:col-span-2 text-sm text-destructive">{profileError}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" onClick={saveProfileAndContinue} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save and continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label className="mb-1 block text-sm">{label}</Label>
      {children}
    </label>
  );
}
