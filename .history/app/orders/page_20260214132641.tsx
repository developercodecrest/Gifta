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
      <header>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-sm text-muted">Track deliveries and revisit your previous gifting choices.</p>
      </header>

      <div className="space-y-4">
        {mockOrders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Order ID</p>
                <h2 className="font-semibold">{order.id}</h2>
              </div>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium">{order.status}</span>
            </div>

            <p className="mt-3 text-sm text-muted">{order.items}</p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted">Placed on {order.date}</span>
              <span className="font-semibold">{order.total}</span>
            </div>
          </article>
        ))}
      </div>

      <Link href="/store" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium">
        Shop more gifts
      </Link>
    </div>
  );
}
