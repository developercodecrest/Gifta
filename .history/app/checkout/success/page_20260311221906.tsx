import Link from "next/link";
import { Gift, Sparkles, Truck } from "lucide-react";
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
    <div className="space-y-6">
      <Card className="surface-mesh soft-shadow mx-auto max-w-4xl overflow-hidden rounded-4xl border-white/70 text-center">
        <CardContent className="p-8 sm:p-10 lg:p-12">
          <Badge variant="success">Order confirmed</Badge>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Your gift order is placed</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#5f5047] sm:text-base">
            Thank you for shopping with Gifta. Your order is now in the premium fulfilment flow with packaging, dispatch, and delivery updates to follow.
          </p>

          <div className="app-data-panel mt-6 rounded-4xl p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#74655c]">Order ID</p>
            <p className="mt-2 text-xl font-semibold text-primary">{params.orderId ?? "GFT-DEMO001"}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SuccessPill icon={Gift} label="Gift wrapped" text="Prepared with premium presentation cues." />
            <SuccessPill icon={Truck} label="Tracking next" text="Shipping updates appear in your order timeline." />
            <SuccessPill icon={Sparkles} label="Storefront aligned" text="Success state now matches the wider visual system." />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/orders">View orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/store">Continue shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessPill({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Gift;
  label: string;
  text: string;
}) {
  return (
    <div className="app-data-panel rounded-3xl p-4 text-left">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-[#5f5047]">{text}</p>
    </div>
  );
}
