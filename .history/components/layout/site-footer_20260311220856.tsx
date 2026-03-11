import type { ElementType } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { ArrowRight, Gift, RefreshCw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const footerColumns = [
  {
    title: "Shop by occasion",
    links: [
      { label: "Birthday gifts", href: "/search?category=Birthday" },
      { label: "Anniversary gifts", href: "/search?category=Anniversary" },
      { label: "Same-day picks", href: "/search?tag=same-day" },
      { label: "Premium gifting", href: "/search?tag=luxury" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Search gifts", href: "/search" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Track orders", href: "/orders" },
      { label: "My account", href: "/account" },
    ],
  },
  {
    title: "Why Gifta",
    links: [
      { label: "Trusted vendors", href: "/search?sort=rating" },
      { label: "Curated collections", href: "/store" },
      { label: "Personalized gifts", href: "/search?tag=personalized" },
      { label: "Fast dispatch", href: "/search?tag=same-day" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-[linear-gradient(180deg,#21170d_0%,#181007_100%)] text-[#fff6e4]">
      <div className="page-gutter py-14 sm:py-16">
        <div className="mx-auto max-w-[1600px] px-2 sm:px-4">
        <section className="surface-mesh subtle-shadow overflow-hidden rounded-[2rem] p-6 text-[#2b1715] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <Badge className="mb-4 border-0 bg-[#20161f] text-white">Gifta gifting journal</Badge>
              <h2 className="font-display max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
                Make every delivery feel like an event, not just a package.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[#5c4741] sm:text-base">
                Curated gifting, thoughtful wrapping, responsive support, and premium presentation across every celebration.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <HighlightCard icon={Truck} title="Fast delivery" text="Same-day and scheduled surprises in major cities." />
              <HighlightCard icon={ShieldCheck} title="Protected checkout" text="Secure payments, verified vendors, and transparent support." />
              <HighlightCard icon={RefreshCw} title="Help when needed" text="Order support and gifting assistance without the friction." />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-white/8 bg-white/[0.045] p-6 shadow-[0_20px_50px_-38px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <Badge variant="outline" className="border-transparent bg-white/8 text-[#ffd8bf]">Curated for celebrations</Badge>
                <h3 className="font-display mt-4 text-2xl font-semibold text-white sm:text-3xl">Explore Gifta by mood, moment, and delivery speed</h3>
                <p className="mt-3 max-w-xl text-sm text-[#d8c0b4]">
                  Designed for customers who want premium visual presentation, fast discovery, and gifting confidence.
                </p>
              </div>

              <Button asChild>
                <Link href="/search">
                  Explore catalog
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {footerColumns.map((column) => (
                <section key={column.title}>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffd8bf]">{column.title}</h4>
                  <div className="mt-4 grid gap-3 text-sm text-[#fff6ee]">
                    {column.links.map((link) => (
                      <Link key={link.label} href={link.href} className="transition hover:text-[#ffbf97]">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_50px_-38px_rgba(0,0,0,0.55)] backdrop-blur sm:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#ffd8bf]">
                <Gift className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-xl font-semibold text-white">Newsletter and updates</h3>
                <p className="text-sm text-[#d8c0b4]">Get launch drops, seasonal edits, and special pricing before everyone else.</p>
              </div>
            </div>

            <form className="mt-6" action="#">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input type="email" placeholder="Enter your email" className="h-12 border-white/12 bg-white text-slate-900 placeholder:text-slate-400" />
                <Button type="submit" className="h-12 sm:px-6">Join Gifta</Button>
              </div>

              <Label className="mt-4 flex items-start gap-2 text-xs text-[#d8c0b4]">
                <Checkbox className="mt-0.5 border-white/20 data-[state=checked]:border-primary" />
                <span className="leading-5">
                  I agree to receive gifting updates and have reviewed Gifta&apos;s <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-white">privacy terms</Link>.
                </span>
              </Label>
            </form>

            <div className="mt-8 flex items-center gap-3">
              <SocialIcon href="/" label="Twitter" icon={FaXTwitter} />
              <SocialIcon href="/" label="Facebook" icon={FaFacebookF} />
              <SocialIcon href="/" label="Instagram" icon={FaInstagram} />
              <SocialIcon href="/" label="YouTube" icon={FaYoutube} />
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-black/20 p-5 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-[#ffbf97]" />
                Secure online checkout
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#ffe8d7]">
                <PaymentBadge label="VISA" />
                <PaymentBadge label="Mastercard" />
                <PaymentBadge label="UPI" />
                <PaymentBadge label="Razorpay" />
              </div>
            </div>
          </section>
        </div>

        <Separator className="my-8 bg-white/8" />

        <div className="flex flex-col gap-4 text-xs text-[#d8c0b4] sm:gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="transition hover:text-white hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="transition hover:text-white hover:underline">Terms & Conditions</Link>
            <span>•</span>
            <Link href="/search" className="transition hover:text-white hover:underline">Browse Gifts</Link>
            <span>•</span>
            <Link href="/account" className="transition hover:text-white hover:underline">Account</Link>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Gifta. Premium gifting experiences for birthdays, anniversaries, and every meaningful surprise.</p>
            <p>Crafted with vibrant visuals, fast discovery, and fully responsive flows.</p>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-white/88 p-4 shadow-[0_16px_30px_-26px_rgba(113,52,39,0.22)]">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[#6a5148]">{text}</p>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ElementType;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-slate-100 shadow-[0_16px_24px_-22px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:bg-white/12"
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return <span className="inline-flex min-h-6 items-center rounded-full bg-white/8 px-2.5 py-1 shadow-[0_12px_24px_-20px_rgba(0,0,0,0.45)]">{label}</span>;
}
