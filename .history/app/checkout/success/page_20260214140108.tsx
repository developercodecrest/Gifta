import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[#edd2d9] bg-white p-8 text-center">
      <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Order Confirmed</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#24438f]">Your gift order is placed 🎉</h1>
      <p className="mt-2 text-sm text-[#2f3a5e]/80">
        Thank you for shopping with Gifta. We are preparing your package with premium wrapping.
      </p>

      <div className="mt-5 rounded-xl border border-[#edd2d9] bg-[#fff1f4] p-4">
        <p className="text-xs uppercase tracking-wider text-[#2f3a5e]/65">Order ID</p>
        <p className="mt-1 text-lg font-semibold text-[#24438f]">{params.orderId ?? "GFT-DEMO001"}</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/orders" className="rounded-lg bg-[#24438f] px-4 py-2 text-sm font-semibold text-white">
          View orders
        </Link>
        <Link href="/store" className="rounded-lg border border-[#edd2d9] bg-white px-4 py-2 text-sm font-semibold text-[#24438f]">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
