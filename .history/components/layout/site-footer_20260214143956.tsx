import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-[#f0bfd0] bg-linear-to-r from-[#c64f8f] via-[#9f3f85] to-[#3a2a3f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3 md:gap-10">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-[0.08em]">Find a Store</h3>
            <p className="mt-2 text-sm text-white/85">Find Gifta products near you</p>
            <Link
              href="/store"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-[#f8a6c8] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-[#3e1e3f] transition hover:bg-[#ffb7d3] sm:w-52"
            >
              Store Locator
            </Link>
          </div>
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Link href="/store" className="rounded-xl bg-[#24438f] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90">
              Shop now
            </Link>
            <Link href="/store?category=Corporate" className="rounded-xl border border-[#e8c7d0] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#24438f] transition hover:bg-[#fff6f8]">
              Corporate gifting
            </Link>
          <div>
            <h3 className="text-lg font-bold uppercase tracking-[0.08em]">Follow Us</h3>
            <div className="mt-4 flex items-center gap-4">
              <SocialLink href="/" label="Twitter" icon={Twitter} />
              <SocialLink href="/" label="Facebook" icon={Facebook} />
              <SocialLink href="/" label="Instagram" icon={Instagram} />
              <SocialLink href="/" label="YouTube" icon={Youtube} />
            </div>
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

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} aria-label={label} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition hover:bg-white/20">
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function PaymentPill({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-sm bg-white px-2.5 py-1">{label}</span>
  );
}
