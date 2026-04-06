"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OrdersAuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const callbackUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    setOpen(status === "unauthenticated");
  }, [status]);

  if (status === "loading") {
    return (
      <Card className="rounded-3xl border-dashed border-[#e6d0c4] bg-white/80">
        <CardContent className="p-8 text-center text-sm text-[#5f5047]">Checking your session...</CardContent>
      </Card>
    );
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Sign in to view orders</DialogTitle>
            <DialogDescription>
              Your order history and tracking details are available only after secure sign-in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild>
              <Link href={`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl || "/orders")}`}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/store">Continue shopping</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-3xl border-dashed border-[#e6d0c4] bg-white/80">
        <CardContent className="p-10 text-center">
          <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 text-base font-semibold">Sign in required</p>
          <p className="mt-1 text-sm text-[#5f5047]">Please sign in to access your orders and live tracking details.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl || "/orders")}`}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/store">Shop gifts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
