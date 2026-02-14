import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="rounded-2xl border border-border p-6">
      <h2 className="text-2xl font-bold">Create account</h2>
      <p className="mt-1 text-sm text-muted">Join Gifta for a faster gifting experience.</p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input type="text" placeholder="First name" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </Field>
        <Field label="Last name">
          <input type="text" placeholder="Last name" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <input type="email" placeholder="you@example.com" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </Field>
        <Field label="Password" className="sm:col-span-2">
          <input type="password" placeholder="Create password" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </Field>
        <button type="button" className="sm:col-span-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Create account
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
