import type { ElementType } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { ArrowUp, Gift, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const footerColumns = [
  {
    title: "Quick links",
    links: [
      { label: "Home", href: "/" },
      { label: "Shop all gifts", href: "/search" },
      { label: "Bestsellers", href: "/search?sort=rating" },
      { label: "Same-day delivery", href: "/search?tag=same-day" },
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

const trustMarks = ["Curated gifting", "Trusted vendors", "Same-day delivery", "Premium edits", "Secure checkout"];

const officeDetails = [
  { label: "+91 910-935-8249", href: "tel:+919109358249", icon: Phone },
  { label: "hello@gifta.in", href: "mailto:hello@gifta.in", icon: Mail },
  { label: "Gifta Studio, India", href: "/account", icon: MapPin },
];

export function Footer() {
  return (
    <footer className="mt-18 border-t border-[#e6d4aa] bg-[linear-gradient(180deg,#f6ecd1_0%,#eedfb5_20%,#2e2112_20%,#1b130b_100%)] text-[#f9edd3]">
      <div className="page-gutter py-8 sm:py-10">
        <div className="mx-auto max-w-400 px-2 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-t-[1.35rem] bg-[#efe2bb] px-5 py-4 text-[#8a6820] shadow-[0_14px_34px_-26px_rgba(95,69,20,0.22)] sm:px-8">
            <Link href="/" className="inline-flex items-center">
              <Image src="/logo.jpeg" alt="Gifta" width={112} height={48} className="h-11 w-auto object-contain" />
            </Link>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-[0.18em] sm:text-sm">
              {trustMarks.map((mark) => (
                <span key={mark}>{mark}</span>
              ))}
            </div>
          </div>

          <section className="relative overflow-hidden rounded-b-[1.8rem] border border-white/8 bg-[linear-gradient(135deg,rgba(201,155,42,0.16),rgba(31,22,11,0.94)_24%,rgba(27,19,11,0.98)_100%)] p-6 shadow-[0_24px_54px_-40px_rgba(0,0,0,0.58)] sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,178,85,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
            <div className="relative flex flex-col gap-10">
              <div className="grid gap-8 lg:grid-cols-[0.85fr_0.85fr_0.95fr_1.15fr]">
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

                <section className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0d18d]">Our office</h3>
                    <div className="mt-4 grid gap-3 text-sm text-[#f8efe2]">
                      {officeDetails.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.label} href={item.href} className="flex items-start gap-3 transition hover:text-[#f0d18d]">
                            <Icon className="mt-0.5 h-4 w-4 text-[#d9b255]" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f0d18d]">Our purpose</h3>
                    <p className="mt-4 text-sm leading-7 text-[#d8c0b4]">
                      Gifta brings curated gifting, trusted vendors, and celebration-ready delivery together in one premium experience.
                    </p>
                  </div>
                </section>
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="max-w-2xl">
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
                      <Button type="submit" className="h-12 min-w-36 sm:px-6">Join Gifta</Button>
                    </div>

                    <Label className="mt-4 flex items-start gap-2 text-xs text-[#d8c0b4]">
                      <Checkbox className="mt-0.5 border-white/20 data-[state=checked]:border-primary" />
                      <span className="leading-5">
                        I agree to receive updates and have reviewed Gifta&apos;s <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-white">privacy terms</Link>.
                      </span>
                    </Label>
                  </form>
                </div>

                <div className="flex flex-col items-start gap-6 lg:items-end">
                  <Button asChild className="min-w-36">
                    <Link href="/search?tag=luxury">Explore premium gifts</Link>
                  </Button>
                  <div className="flex items-center gap-3">
                    <SocialIcon href="/" label="Twitter" icon={FaXTwitter} />
                    <SocialIcon href="/" label="Facebook" icon={FaFacebookF} />
                    <SocialIcon href="/" label="Instagram" icon={FaInstagram} />
                    <SocialIcon href="/" label="YouTube" icon={FaYoutube} />
                  </div>
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
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <p>© {new Date().getFullYear()} Gifta. Curated gifting for birthdays, anniversaries, and meaningful surprises.</p>
              <Link
                href="#top"
                className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#e6d4aa] bg-[#efe2bb] text-[#8a6820] shadow-[0_16px_26px_-22px_rgba(95,69,20,0.45)] transition hover:-translate-y-0.5 hover:bg-white"
                aria-label="Back to top"
              >
                <ArrowUp className="h-5 w-5" />
              </Link>
              <p className="sm:text-right">Built for elegant discovery, trusted checkout, and responsive gifting flows.</p>
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
