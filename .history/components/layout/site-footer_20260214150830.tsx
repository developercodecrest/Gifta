import type { ElementType } from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-[#efbfd3] bg-linear-to-r from-[#ca4f90] via-[#9d3f86] to-[#38263c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <section>
            <h3 className="text-lg font-bold uppercase tracking-[0.08em]">Find a Store</h3>
            <p className="mt-2 text-sm text-white/85">Find Gifta products near you</p>
            <Link
              href="/store"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-[#f7a4c8] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-[#3f1f40] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffb7d5] hover:shadow-[0_10px_20px_rgba(201,74,137,0.18)] sm:w-56"
            >
              Store Locator
            </Link>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-[0.08em]">Follow Us</h3>
            <div className="mt-4 flex items-center gap-3">
              <SocialIcon href="/" label="Twitter" icon={Twitter} />
              <SocialIcon href="/" label="Facebook" icon={Facebook} />
              <SocialIcon href="/" label="Instagram" icon={Instagram} />
              <SocialIcon href="/" label="YouTube" icon={Youtube} />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-[0.08em]">Newsletter Subscription</h3>
            <p className="mt-2 text-sm text-white/85">Receive product news and updates in your inbox.</p>

            <form className="mt-4" action="#">
              <div className="flex overflow-hidden rounded-sm border border-white/30 bg-white/95">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="min-h-11 w-full bg-transparent px-3 text-sm text-[#35233b] outline-none placeholder:text-[#75697b]"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center bg-[#f7a4c8] px-3 text-xl text-[#3f1f40] transition duration-200 hover:bg-[#ffb7d5]"
                  aria-label="Subscribe newsletter"
                >
                  ›
                </button>
              </div>

              <label className="mt-3 flex items-start gap-2 text-xs text-white/80">
                <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-white/60 bg-transparent" />
                <span>
                  I&apos;ve read and accept Gifta&apos;s{" "}
                  <Link href="/account" className="underline underline-offset-2 hover:text-white">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </form>
          </section>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-base font-bold uppercase tracking-[0.08em]">Secure Online Shopping</h4>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#3f1f40]">
              <PaymentBadge label="VISA" />
              <PaymentBadge label="Mastercard" />
              <PaymentBadge label="Maestro" />
              <PaymentBadge label="PayPal" />
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_10px_20px_rgba(201,74,137,0.18)]"
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return <span className="inline-flex min-h-6 items-center rounded-sm bg-white px-2.5 py-1">{label}</span>;
}
