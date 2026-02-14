import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="rounded-2xl border border-[#edd2d9] p-6">
      <h2 className="text-2xl font-bold tracking-tight text-[#24438f]">Sign in</h2>
      <p className="mt-1 text-sm text-[#2f3a5e]/80">Continue with your Gifta account.</p>

      <form className="mt-6 space-y-4">
        <Field label="Email">
          <input
            type="email"
            placeholder="you@example.com"
            className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            placeholder="Enter password"
            className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm"
          />
        </Field>

        <button type="button" className="min-h-11 w-full rounded-lg bg-[#24438f] px-4 py-2.5 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-[#2f3a5e]/75 transition hover:text-[#24438f]">
          Forgot password?
        </Link>
        <Link href="/auth/sign-up" className="font-medium text-[#24438f]">
          Create account
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#2f3a5e]">{label}</span>
      {children}
    </label>
  );
}
