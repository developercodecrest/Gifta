import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutPageClient } from "@/features/cart/ui/checkout-page-client";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { getUserCart } from "@/lib/server/user-cart-service";

export default async function CheckoutPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/sign-in?callbackUrl=%2Fcart%3FcheckoutReady%3D1");
  }

  const cookieStore = await cookies();
  const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
  const cookieCartItems = parseCartCookie(cartCookie);

  let cartItems = [];
  const userCartItems = await getUserCart(userId).catch(() => []);
  cartItems = userCartItems.length ? userCartItems : cookieCartItems;

  const snapshot = await buildCartSnapshot(cartItems).catch(() => ({
    lines: [],
    vendors: [],
    subtotal: 0,
    shipping: 0,
    tax: 0,
    platformFee: 0,
    total: 0,
    itemCount: 0,
  }));

  return <CheckoutPageClient snapshot={snapshot} />;
}
