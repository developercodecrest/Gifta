import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-[#f3ced5] bg-gradient-to-r from-[#ffeef2] via-[#ffe6ec] to-[#ffdce5] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#24438f]">My Profile</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#24438f]">My Account</h1>
        <p className="mt-2 text-sm text-[#2f3a5e]/80">Manage profile, saved addresses, and gifting preferences.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AccountTile title="Sign In" desc="Access your saved profile and orders" href="/auth/sign-in" />
        <AccountTile title="Profile Details" desc="Name, email, phone and preferences" href="/account" />
        <AccountTile title="Order History" desc="Track current and past orders" href="/orders" />
        <AccountTile title="Saved Wishlist" desc="Your liked premium collections" href="/wishlist" />
      </section>

      <section className="rounded-2xl border border-[#edd2d9] bg-[#fff1f4] p-6">
        <h2 className="text-lg font-semibold text-[#24438f]">Gift Concierge (extra feature)</h2>
        <p className="mt-2 text-sm text-[#2f3a5e]/80">
          Need bulk or personalized gifting? Our concierge experience is available for corporate and event gifting.
        </p>
        <Link href="/store?category=Corporate" className="mt-4 inline-flex rounded-lg bg-[#24438f] px-4 py-2 text-sm font-semibold text-white">
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
    <Link href={href} className="rounded-xl border border-[#edd2d9] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <h3 className="font-semibold text-[#21212b]">{title}</h3>
      <p className="mt-1 text-sm text-[#2f3a5e]/75">{desc}</p>
    </Link>
  );
}
