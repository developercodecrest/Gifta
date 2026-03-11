import type { ElementType } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
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
    <footer className="mt-18 border-t border-[#e6d4aa] bg-[linear-gradient(180deg,#2a1d10_0%,#1b130b_100%)] text-[#f9edd3]">
      <div className="page-gutter py-12 sm:py-14">
        <div className="mx-auto max-w-400 px-2 sm:px-4">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[1.9rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_50px_-38px_rgba(0,0,0,0.52)] backdrop-blur sm:p-8">
              <Badge variant="outline" className="border-[#59401a] bg-[#3a2a14] text-[#f3d99b]">Curated gifting</Badge>
              <h2 className="font-display mt-4 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Simple gifting flows with premium presentation and faster discovery.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[#dbc6b0] sm:text-base">
                Browse occasions, discover trusted vendors, and check out with confidence across every celebration.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/search">Explore catalog</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#705124] bg-white/6 text-[#f7ead1] hover:bg-white/10 hover:text-white">
                  <Link href="/store">Browse stores</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {footerColumns.map((column) => (
                  <section key={column.title}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0d18d]">{column.title}</h3>
                    <div className="mt-4 grid gap-3 text-sm text-[#f8efe2]">
                      {column.links.map((link) => (
                        <Link key={link.label} href={link.href} className="transition hover:text-[#f0d18d]">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HighlightCard icon={Truck} title="Fast delivery" text="Same-day and scheduled gifting in selected cities." />
                <HighlightCard icon={ShieldCheck} title="Trusted checkout" text="Secure payments with verified vendors and clear support." />
                <HighlightCard icon={Sparkles} title="Curated edits" text="Collections designed for birthdays, anniversaries, and premium gifting." />
              </div>
            </section>

            <section className="rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_50px_-38px_rgba(0,0,0,0.52)] backdrop-blur sm:p-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#f0d18d]">
                  <Gift className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Newsletter and updates</h2>
                  <p className="text-sm text-[#d8c0b4]">Get seasonal launches and special gifting offers before everyone else.</p>
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
                    I agree to receive updates and have reviewed Gifta&apos;s <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-white">privacy terms</Link>.
                  </span>
                </Label>
              </form>

              <div className="mt-8 flex items-center gap-3">
                <SocialIcon href="/" label="Twitter" icon={FaXTwitter} />
                <SocialIcon href="/" label="Facebook" icon={FaFacebookF} />
                <SocialIcon href="/" label="Instagram" icon={FaInstagram} />
                <SocialIcon href="/" label="YouTube" icon={FaYoutube} />
              </div>

              <div className="mt-8 rounded-[1.4rem] border border-white/6 bg-black/20 p-5 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-[#f0d18d]" />
                  Secure online checkout
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#f7ead1]">
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
              <p>© {new Date().getFullYear()} Gifta. Curated gifting for birthdays, anniversaries, and meaningful surprises.</p>
              <p>Built for elegant discovery, trusted checkout, and responsive gifting flows.</p>
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
    <div className="rounded-[1.25rem] border border-white/8 bg-white/5 p-4 shadow-[0_16px_30px_-26px_rgba(0,0,0,0.28)]">
      <Icon className="h-5 w-5 text-[#f0d18d]" />
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-[#d5beaa]">{text}</p>
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/8 text-slate-100 shadow-[0_16px_24px_-22px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:bg-white/12"
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return <span className="inline-flex min-h-6 items-center rounded-full border border-white/8 bg-white/8 px-2.5 py-1 shadow-[0_12px_24px_-20px_rgba(0,0,0,0.45)]">{label}</span>;
}
