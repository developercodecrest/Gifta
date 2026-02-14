import Link from "next/link";
import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-[#f3ced5] bg-linear-to-b from-[#fff1f4] via-[#ffe7ee] to-[#ffdce8]">
      <div className="border-b border-[#eccfd8]/80 bg-white/55 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f3a5e]/70">Make Every Gift Unforgettable</p>
            <h3 className="text-xl font-bold tracking-tight text-[#24438f] sm:text-3xl">Need help choosing the perfect gift?</h3>
          </div>
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Link href="/store" className="rounded-xl bg-[#24438f] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90">
              Shop now
            </Link>
            <Link href="/store?category=Corporate" className="rounded-xl border border-[#e8c7d0] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#24438f] transition hover:bg-[#fff6f8]">
              Corporate gifting
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-10 lg:px-8">
        <div className="rounded-2xl border border-[#e8c7d0] bg-white/75 p-5 backdrop-blur-sm">
          <h3 className="text-2xl font-bold tracking-tight text-[#24438f]">Gifta</h3>
          <p className="mt-3 text-sm text-[#2f3a5e]/80">
            Premium gifting experiences curated for birthdays, weddings, festive moments, and corporate celebrations.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <TrustPill icon={Truck} label="Fast delivery" />
            <TrustPill icon={Gift} label="Premium wrap" />
            <TrustPill icon={ShieldCheck} label="Secure checkout" />
            <TrustPill icon={Sparkles} label="Curated gifts" />
          </div>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            { label: "All Gifts", href: "/store" },
            { label: "Birthday", href: "/store?category=Birthday" },
            { label: "Anniversary", href: "/store?category=Anniversary" },
            { label: "Corporate", href: "/store?category=Corporate" },
          ]}
        />

        <FooterColumn
          title="Customer"
          links={[
            { label: "Wishlist", href: "/wishlist" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout", href: "/checkout" },
            { label: "Orders", href: "/orders" },
          ]}
        />

        <FooterColumn
          title="Company"
          links={[
            { label: "My Account", href: "/account" },
            { label: "Create Account", href: "/auth/sign-up" },
            { label: "Gift Concierge", href: "/store?category=Corporate" },
            { label: "Support", href: "/account" },
          ]}
        />
      </div>

      <div className="border-t border-[#eccfd8]/70 bg-white/45">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-4 text-center text-xs text-[#2f3a5e]/70 sm:justify-between sm:text-left sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Gifta. Crafted for meaningful gifting.</p>
          <div className="flex items-center gap-4">
            <Link href="/account" className="transition hover:text-[#24438f]">
              Support
            </Link>
            <Link href="/checkout" className="transition hover:text-[#24438f]">
              Payments
            </Link>
            <Link href="/orders" className="transition hover:text-[#24438f]">
              Delivery
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TrustPill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#e8c7d0] bg-white px-2 py-1 text-xs text-[#2f3a5e]/80">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f3a5e]/70">{title}</h4>
      <ul className="mt-3 space-y-2.5 text-sm text-[#2f3a5e]/90">
        {links.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href} className="inline-flex rounded-sm transition hover:translate-x-0.5 hover:text-[#24438f]">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
