import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 rounded-3xl border border-border bg-white p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
      <section className="space-y-4 rounded-2xl bg-surface p-6">
        <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Gifta Membership</p>
        <h1 className="text-3xl font-bold">Welcome to your premium gifting account.</h1>
        <p className="text-sm text-muted">
          Track orders, save wishlists, manage addresses, and enjoy faster checkout for every celebration.
        </p>
        <ul className="space-y-2 text-sm text-muted">
          <li>• One-click checkout experience</li>
          <li>• Save favorite gift collections</li>
          <li>• Access order timeline and updates</li>
        </ul>
        <Link href="/store" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium">
          Continue shopping
        </Link>
      </section>
      <section>{children}</section>
    </div>
  );
}
