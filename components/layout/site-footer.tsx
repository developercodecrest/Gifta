import type { ElementType } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-primary/80 bg-primary text-[#2c1220]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-xl border border-[#2c1220]/20 bg-[#2c1220]/10 p-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#2c1220]" /> Fast dispatch in 24-48 hrs</div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2c1220]" /> Secure payments & buyer safety</div>
          <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-[#2c1220]" /> Easy return assistance</div>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <section>
            <Badge variant="outline" className="mb-3">Need help choosing gifts?</Badge>
            <h3 className="text-lg font-bold">Discover curated collections</h3>
            <p className="mt-2 text-sm text-[#2c1220]/85">Find gifts by occasion, budget, and delivery speed in our ecommerce catalog.</p>
            <Button asChild className="mt-5 w-full sm:w-auto">
              <Link href="/store">Browse store</Link>
            </Button>
          </section>

          <section>
            <h3 className="text-lg font-bold">Follow Us</h3>
            <div className="mt-4 flex items-center gap-3">
              <SocialIcon href="/" label="Twitter" icon={FaXTwitter} />
              <SocialIcon href="/" label="Facebook" icon={FaFacebookF} />
              <SocialIcon href="/" label="Instagram" icon={FaInstagram} />
              <SocialIcon href="/" label="YouTube" icon={FaYoutube} />
            </div>
            <p className="mt-3 text-sm text-[#2c1220]/85">Daily gift ideas, festive edits, and customer stories.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold">Newsletter</h3>
            <p className="mt-2 text-sm text-[#2c1220]/85">Receive product updates, launch drops, and seasonal offers.</p>

            <form className="mt-4" action="#">
              <div className="flex items-center gap-2">
                <Input type="email" placeholder="Email address" />
                <Button type="submit" aria-label="Subscribe newsletter">Join</Button>
              </div>

              <Label className="mt-3 flex items-start gap-2 text-xs text-[#2c1220]/85">
                <Checkbox className="mt-0.5" />
                <span className="leading-5">
                  I&apos;ve read and accept Gifta&apos;s{" "}
                  <Link href="/account" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </Label>
            </form>
          </section>
        </div>

        <Separator className="my-8" />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-[#2c1220]/85">Secure Online Shopping</h4>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <PaymentBadge label="VISA" />
              <PaymentBadge label="Mastercard" />
              <PaymentBadge label="Maestro" />
              <PaymentBadge label="PayPal" />
            </div>
          </div>
          <p className="mt-4 text-xs text-[#2c1220]/85">© {new Date().getFullYear()} Gifta. Crafted for premium ecommerce gifting experiences.</p>
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2c1220]/25 bg-[#2c1220]/10 text-[#2c1220] transition hover:bg-[#2c1220]/20"
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return <span className="inline-flex min-h-6 items-center rounded-md border border-[#2c1220]/25 bg-[#2c1220]/10 px-2.5 py-1">{label}</span>;
}
