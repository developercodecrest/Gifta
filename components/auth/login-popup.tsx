"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const pathname = usePathname();
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

  if (!open || pathname.startsWith("/auth")) return null;

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

        <form className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="popup-email">Email</Label>
            <Input id="popup-email" type="email" placeholder="Email address" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="popup-password">Password</Label>
            <Input id="popup-password" type="password" placeholder="Password" />
          </div>
          <Button type="button" className="w-full">Sign in</Button>
        </form>

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
