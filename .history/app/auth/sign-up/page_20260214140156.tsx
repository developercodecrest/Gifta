import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="rounded-2xl border border-[#edd2d9] p-6">
      <h2 className="text-2xl font-bold tracking-tight text-[#24438f]">Create account</h2>
      <p className="mt-1 text-sm text-[#2f3a5e]/80">Join Gifta for a faster gifting experience.</p>

      <form className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input type="text" placeholder="First name" className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
        </Field>
        <Field label="Last name">
          <input type="text" placeholder="Last name" className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <input type="email" placeholder="you@example.com" className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
        </Field>
        <Field label="Password" className="sm:col-span-2">
          <input type="password" placeholder="Create password" className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
        </Field>
        <button type="button" className="sm:col-span-2 min-h-11 w-full rounded-lg bg-[#24438f] px-4 py-2.5 text-sm font-semibold text-white">
          Create account
        </button>
      </form>

      <p className="mt-4 text-sm text-[#2f3a5e]/80">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-medium text-[#24438f]">
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
      <span className="mb-1 block text-sm font-medium text-[#2f3a5e]">{label}</span>
      {children}
    </label>
  );
}
