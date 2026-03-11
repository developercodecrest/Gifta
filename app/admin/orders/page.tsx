import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { OrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  const identity = await ensureAdminAccess("orders");

  const orders = await getAdminOrdersScoped(identity).catch(() => []);
  const pending = orders.filter((order) => ["placed", "packed", "out-for-delivery"].includes(order.status)).length;
  const shipped = orders.filter((order) => order.shippingAwb).length;
  const shippingIssues = orders.filter((order) => order.shippingError).length;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Orders"
        title="Fulfillment pipeline and delivery exceptions"
        description="Track payment, shipping, and delivery progress across every store in your admin scope."
        stats={[
          { label: "Orders", value: String(orders.length), tone: "warm" },
          { label: "Pending flow", value: String(pending), tone: "sun" },
          { label: "Shipped", value: String(shipped), tone: "mint" },
          { label: "Shipping issues", value: String(shippingIssues), tone: "warm" },
        ]}
      />

      <AdminSection title="Order operations" description="Update statuses, retry Delhivery shipment creation, and inspect payment plus delivery metadata.">
        <OrdersClient orders={orders} />
      </AdminSection>
    </div>
  );
}
