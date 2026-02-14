import Link from "next/link";
import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Make Every Gift Unforgettable</p>
            <h3 className="text-xl font-bold tracking-tight">Need help choosing the perfect gift?</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/store" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Shop now
            </Link>
            <Link href="/store?category=Corporate" className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold transition hover:bg-surface">
              Corporate gifting
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-10 lg:px-8">
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="text-2xl font-bold text-primary">Gifta</h3>
          <p className="mt-3 text-sm text-muted">
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
            { label: "Sign In", href: "/auth/sign-in" },
            { label: "Create Account", href: "/auth/sign-up" },
            { label: "Gift Concierge", href: "/store?category=Corporate" },
          ]}
        />
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-muted sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Gifta. Crafted for meaningful gifting.</p>
          <div className="flex items-center gap-4">
            <Link href="/account" className="transition hover:text-foreground">
              Support
            </Link>
            <Link href="/checkout" className="transition hover:text-foreground">
              Payments
            </Link>
            <Link href="/orders" className="transition hover:text-foreground">
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
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted">
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
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h4>
      <ul className="mt-3 space-y-2.5 text-sm text-muted">
        {links.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href} className="inline-flex rounded-sm transition hover:translate-x-0.5 hover:text-foreground">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
