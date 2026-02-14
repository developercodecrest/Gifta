import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-border p-6">
      <h2 className="text-2xl font-bold">Reset password</h2>
      <p className="mt-1 text-sm text-muted">Enter your email and we will send reset instructions.</p>

      <form className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>

        <button type="button" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Send reset link
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Remembered your password?{" "}
        <Link href="/auth/sign-in" className="font-medium text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
