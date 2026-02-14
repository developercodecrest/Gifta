import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 rounded-3xl border border-[#edd2d9] bg-white p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
      <section className="space-y-4 rounded-2xl border border-[#f3ced5] bg-gradient-to-b from-[#ffeef2] to-[#fff1f4] p-6">
        <p className="inline-flex rounded-full bg-[#24438f]/10 px-3 py-1 text-xs font-semibold text-[#24438f]">Gifta Membership</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#24438f]">Welcome to your premium gifting account.</h1>
        <p className="text-sm text-[#2f3a5e]/80">
          Track orders, save wishlists, manage addresses, and enjoy faster checkout for every celebration.
        </p>
        <ul className="space-y-2 text-sm text-[#2f3a5e]/80">
          <li>• One-click checkout experience</li>
          <li>• Save favorite gift collections</li>
          <li>• Access order timeline and updates</li>
        </ul>
        <Link href="/store" className="inline-flex rounded-lg border border-[#edd2d9] bg-white px-4 py-2 text-sm font-medium text-[#24438f]">
          Continue shopping
        </Link>
      </section>
      <section>{children}</section>
    </div>
  );
}
