import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="rounded-2xl border border-border p-6">
      <h2 className="text-2xl font-bold">Sign in</h2>
      <p className="mt-1 text-sm text-muted">Continue with your Gifta account.</p>

      <form className="mt-6 space-y-4">
        <Field label="Email">
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            placeholder="Enter password"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </Field>

        <button type="button" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Sign in
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-muted transition hover:text-foreground">
          Forgot password?
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
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
