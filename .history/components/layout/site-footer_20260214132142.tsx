import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <h3 className="text-xl font-bold text-primary">Gifta</h3>
          <p className="mt-3 text-sm text-muted">
            Premium gifting experiences curated for birthdays, weddings, festive moments, and corporate celebrations.
          </p>
        </div>
        <FooterColumn
          title="Shop"
          links={[
            { label: "All Gifts", href: "/store" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout", href: "/checkout" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { label: "Account", href: "/account" },
            { label: "Orders", href: "/orders" },
            { label: "Gift Concierge", href: "/store?category=Corporate" },
            { label: "Help Center", href: "/account" },
          ]}
        />
        <div>
          <h4 className="font-semibold">Why customers choose us</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Curated premium gift collections</li>
            <li>Fast delivery in major cities</li>
            <li>Personalized notes & wrapping</li>
            <li>Secure mock checkout flow ready for payment integration</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Gifta. Crafted for meaningful gifting.
      </div>
    </footer>
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
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {links.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
