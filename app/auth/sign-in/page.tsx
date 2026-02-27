"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-2 text-sm text-muted-foreground">Loading sign-in...</div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => searchParams.get("callbackUrl") ?? "/", [searchParams]);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpMeta, setOtpMeta] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFinalizingAuth, setIsFinalizingAuth] = useState(false);

  const onRequestOtp = async () => {
    setError(null);
    setStatus(null);
    setOtpMeta(null);

    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setRequestingOtp(true);
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { message?: string; sendsLeft?: number };
        error?: { message?: string; details?: { retryAfterMs?: number; sendsLeft?: number } };
      };

      if (!response.ok || !payload.success) {
        if (response.status === 429 && payload.error?.details?.retryAfterMs) {
          const waitMinutes = Math.ceil(payload.error.details.retryAfterMs / 60000);
          setOtpMeta(`You have reached OTP limit. Try again in ${waitMinutes} minute(s).`);
        }
        setError(payload.error?.message ?? "Unable to send OTP.");
        return;
      }

      setStatus(payload.data?.message ?? "OTP sent. Check your email inbox.");
      if (typeof payload.data?.sendsLeft === "number") {
        setOtpMeta(`OTP sends left this hour: ${payload.data.sendsLeft}`);
      }
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setRequestingOtp(false);
    }
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

      const existsRes = await fetch(`/api/auth/account/exists?email=${encodeURIComponent(email.trim())}`);
      const existsPayload = (await existsRes.json()) as { success?: boolean; data?: { exists?: boolean } };
      const accountExists = Boolean(existsRes.ok && existsPayload.success && existsPayload.data?.exists);

      let intent: "signin" | "signup" = "signin";

      if (!accountExists) {
        const shouldRegister = window.confirm("No account found for this email. Do you want to register now?");
        if (!shouldRegister) {
          setError("Please register first or use another email.");
          setSigningIn(false);
          return;
        }
        intent = "signup";
      }

      const result = await signIn("credentials", {
        email,
        otp,
        intent,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError("Invalid or expired OTP.");
        return;
      }

      setIsFinalizingAuth(true);

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Continue with OTP or Google for your Gifta account.</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <Field label="Email">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Button type="button" className="w-full" variant="outline" onClick={onRequestOtp} disabled={requestingOtp}>
          <Mail className="h-4 w-4" />
          {requestingOtp ? "Sending OTP..." : "Send OTP"}
        </Button>

        <Field label="Enter OTP">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
          />
        </Field>

        <Button type="button" className="w-full" onClick={onOtpSignIn} disabled={signingIn}>
          <ShieldCheck className="h-4 w-4" />
          {signingIn ? "Verifying..." : "Verify OTP & Sign in"}
        </Button>
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

      {isFinalizingAuth ? <p className="text-sm text-muted-foreground">Setting up profile...</p> : null}

      {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
      {otpMeta ? <p className="text-sm text-muted-foreground">{otpMeta}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-muted-foreground transition hover:text-foreground">
          Trouble signing in?
        </Link>
        <Link href="/auth/sign-up" className="font-medium text-primary">
          Create account
        </Link>
      </div>
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
