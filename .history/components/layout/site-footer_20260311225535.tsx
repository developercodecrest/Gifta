import type { ElementType } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Gift } from "lucide-react";
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
      <div className="page-gutter py-10 sm:py-12">
        <div className="mx-auto max-w-400 px-2 sm:px-4">
          <section className="rounded-[1.6rem] border border-white/8 bg-white/4 p-6 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.45)] backdrop-blur sm:p-7">
            <div className="flex flex-col gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <Link href="/" className="inline-flex items-center rounded-2xl bg-white/8 p-2 shadow-[0_12px_24px_-20px_rgba(0,0,0,0.45)]">
                    <Image src="/logo.jpeg" alt="Gifta" width={84} height={36} className="h-9 w-auto object-contain" />
                  </Link>
                  <Badge variant="outline" className="border-[#5e4317] bg-[#3a2a14] text-[#f3d99b]">Gifta</Badge>
                </div>
                <h2 className="font-display mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Thoughtful gifting with simpler discovery and trusted delivery.
                </h2>
                <p className="mt-3 text-sm text-[#dbc6b0] sm:text-base">
                  Browse curated gifts, trusted stores, and celebration-ready collections in one place.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/search">Explore gifts</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-[#705124] bg-transparent text-[#f7ead1] hover:bg-white/8 hover:text-white">
                    <Link href="/account">My account</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
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
                </div>

                <div className="flex items-center gap-3 lg:justify-end">
                  <SocialIcon href="/" label="Twitter" icon={FaXTwitter} />
                  <SocialIcon href="/" label="Facebook" icon={FaFacebookF} />
                  <SocialIcon href="/" label="Instagram" icon={FaInstagram} />
                  <SocialIcon href="/" label="YouTube" icon={FaYoutube} />
                </div>
              </div>
            </div>
          </section>

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
