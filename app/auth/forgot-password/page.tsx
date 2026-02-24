import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold tracking-tight">Passwordless sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">Gifta uses secure OTP and Google sign-in, so password reset is not required.</p>

      <form className="mt-6 space-y-4">
        <label className="block">
          <Label className="mb-1 block text-sm">Email</Label>
          <Input type="email" placeholder="you@example.com" />
        </label>

        <Button type="button" className="w-full" asChild>
          <Link href="/auth/sign-in">Go to OTP sign in</Link>
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Need account access now?{" "}
        <Link href="/auth/sign-in" className="font-medium text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
