import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardContent className="space-y-4 p-6">
          <Badge variant="secondary">Gifta membership</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to your premium gifting account.</h1>
          <p className="text-sm text-muted-foreground">
            Track orders, save wishlists, manage addresses and enjoy faster checkout for every celebration.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• One-click checkout experience</li>
          <li>• Save favorite gift collections</li>
          <li>• Access order timeline and updates</li>
        </ul>
          <Button asChild variant="outline">
            <Link href="/store">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">{children}</section>
    </div>
  );
}
