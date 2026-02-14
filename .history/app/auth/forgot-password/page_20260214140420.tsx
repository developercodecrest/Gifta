import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-[#edd2d9] p-6">
      <h2 className="text-2xl font-bold tracking-tight text-[#24438f]">Reset password</h2>
      <p className="mt-1 text-sm text-[#2f3a5e]/80">Enter your email and we will send reset instructions.</p>

      <form className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#2f3a5e]">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm"
          />
        </label>

        <button type="button" className="min-h-11 w-full rounded-lg bg-[#24438f] px-4 py-2.5 text-sm font-semibold text-white">
          Send reset link
        </button>
      </form>

      <p className="mt-4 text-sm text-[#2f3a5e]/80">
        Remembered your password?{" "}
        <Link href="/auth/sign-in" className="font-medium text-[#24438f]">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
