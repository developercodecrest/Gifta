import Link from "next/link";

const mockOrders = [
  {
    id: "GFT-Q7A8L2",
    date: "12 Feb 2026",
    status: "Packed",
    total: "₹4,899",
    items: "Wedding Bliss Trunk, Wellness Ritual Box",
  },
  {
    id: "GFT-H3M9X1",
    date: "04 Feb 2026",
    status: "Delivered",
    total: "₹2,999",
    items: "Royal Rose Hamper",
  },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-[#f3ced5] bg-gradient-to-r from-[#ffeef2] via-[#ffe6ec] to-[#ffdce5] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#24438f]">Order Timeline</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#24438f]">My Orders</h1>
        <p className="mt-2 text-sm text-[#2f3a5e]/80">Track deliveries and revisit your previous gifting choices.</p>
      </header>

      <div className="space-y-4">
        {mockOrders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-[#edd2d9] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#2f3a5e]/65">Order ID</p>
                <h2 className="font-semibold text-[#21212b]">{order.id}</h2>
              </div>
              <span className="rounded-full bg-[#f8dce2] px-3 py-1 text-xs font-medium text-[#24438f]">{order.status}</span>
            </div>

            <p className="mt-3 text-sm text-[#2f3a5e]/75">{order.items}</p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-[#2f3a5e]/70">Placed on {order.date}</span>
              <span className="font-semibold text-[#24438f]">{order.total}</span>
            </div>
          </article>
        ))}
      </div>

      <Link href="/store" className="inline-flex rounded-lg border border-[#edd2d9] bg-white px-4 py-2 text-sm font-medium text-[#24438f]">
        Shop more gifts
      </Link>
    </div>
  );
}
