"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginPopup() {
  const router = useRouter();
  const { status } = useSession();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.location.pathname.startsWith("/auth")) return false;
    const shown = sessionStorage.getItem("gifta-login-popup-shown");
    if (!shown) {
      sessionStorage.setItem("gifta-login-popup-shown", "1");
      return true;
    }
    return false;
  });

  const onRequestOtp = async () => {
    setError(null);
    setStatusText(null);

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

      setStatusText(payload.data?.message ?? "OTP sent. Check your email inbox.");
    } catch {
      setError("Unable to send OTP right now. Please try again.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const onOtpSignIn = async () => {
    setError(null);
    setStatusText(null);

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
          return;
        }
        intent = "signup";
      }

      const result = await signIn("credentials", {
        email,
        otp,
        intent,
        redirect: false,
        callbackUrl: pathname || "/",
      });

      if (!result || result.error) {
        setError("Invalid or expired OTP.");
        return;
      }

      setOpen(false);
      router.push(result.url ?? pathname ?? "/");
      router.refresh();
    } finally {
      setSigningIn(false);
    }
  };

  if (!open || pathname.startsWith("/auth") || status === "authenticated") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Welcome to Gifta</p>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            Track orders, save wishlist and enjoy faster checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="popup-email">Email</Label>
            <Input
              id="popup-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="popup-otp">OTP</Label>
            <Input
              id="popup-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </div>

          <Button type="button" className="w-full" variant="outline" onClick={onRequestOtp} disabled={requestingOtp}>
            <Mail className="h-4 w-4" />
            {requestingOtp ? "Sending OTP..." : "Send OTP"}
          </Button>

          <Button type="button" className="w-full" onClick={onOtpSignIn} disabled={signingIn}>
            <ShieldCheck className="h-4 w-4" />
            {signingIn ? "Verifying..." : "Verify OTP & Sign in"}
          </Button>

          <Button
            type="button"
            className="w-full"
            variant="secondary"
            onClick={() => signIn("google", { callbackUrl: pathname || "/" })}
          >
            Continue with Google
          </Button>

          {statusText ? <p className="text-sm text-emerald-600">{statusText}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Forgot password?
          </Link>
          <Link href="/auth/sign-up" className="font-medium text-primary" onClick={() => setOpen(false)}>
            Create account
          </Link>
        </div>

        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Continue as guest
        </Button>
      </DialogContent>
    </Dialog>
  );
}
