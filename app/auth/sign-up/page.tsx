"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="p-2 text-sm text-muted-foreground">Loading sign-up...</div>}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => searchParams.get("callbackUrl") ?? "/", [searchParams]);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRequestOtp = async () => {
    setError(null);
    setStatus(null);

    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    try {
      setRequestingOtp(true);
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { message?: string };
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to send OTP.");
        return;
      }

      setStatus(payload.data?.message ?? "OTP sent. Check your email inbox.");
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const onOtpSignup = async () => {
    setError(null);
    setStatus(null);

    if (!email.trim() || !otp.trim()) {
      setError("Email and OTP are required.");
      return;
    }

    try {
      setSigningUp(true);
      const result = await signIn("credentials", {
        email,
        otp,
        intent: "signup",
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError("Invalid or expired OTP.");
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <Badge variant="secondary">New user onboarding</Badge>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign up with OTP or Google in one tap.</p>
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

        <Button type="button" className="w-full" onClick={onOtpSignup} disabled={signingUp}>
          <ShieldCheck className="h-4 w-4" />
          {signingUp ? "Creating account..." : "Verify OTP & Sign up"}
        </Button>
      </div>

      <Button
        type="button"
        className="w-full"
        variant="secondary"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </Button>

      {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="text-sm text-muted-foreground">
        Already have an account? <Link href="/auth/sign-in" className="font-medium text-primary">Sign in</Link>
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
