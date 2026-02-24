import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card className="mx-auto max-w-2xl text-center">
      <CardContent className="p-8">
        <Badge variant="success">Order confirmed</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Your gift order is placed 🎉</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for shopping with Gifta. We are preparing your package with premium wrapping.
        </p>

        <div className="mt-5 rounded-xl border border-border bg-secondary/45 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Order ID</p>
          <p className="mt-1 text-lg font-semibold text-primary">{params.orderId ?? "GFT-DEMO001"}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/orders">View orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/store">Continue shopping</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
