import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-sm text-muted">Manage profile, saved addresses, and gifting preferences.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AccountTile title="Sign In" desc="Access your saved profile and orders" href="/auth/sign-in" />
        <AccountTile title="Profile Details" desc="Name, email, phone and preferences" href="/account" />
        <AccountTile title="Order History" desc="Track current and past orders" href="/orders" />
        <AccountTile title="Saved Wishlist" desc="Your liked premium collections" href="/wishlist" />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Gift Concierge (extra feature)</h2>
        <p className="mt-2 text-sm text-muted">
          Need bulk or personalized gifting? Our concierge experience is available for corporate and event gifting.
        </p>
        <Link href="/store?category=Corporate" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Explore corporate gifts
        </Link>
      </section>
    </div>
  );
}

function AccountTile({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </Link>
  );
}
