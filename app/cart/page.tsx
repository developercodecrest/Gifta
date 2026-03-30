import { cookies } from "next/headers";
import { auth } from "@/auth";
import { CartPageClient } from "@/features/cart/ui/cart-page-client";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { getUserCart } from "@/lib/server/user-cart-service";

export default async function CartPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const cookieStore = await cookies();
  const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
  const cookieCartItems = parseCartCookie(cartCookie);

  let cartItems = [];

  if (userId) {
    const userCartItems = await getUserCart(userId).catch(() => []);
    cartItems = userCartItems.length ? userCartItems : cookieCartItems;
  } else {
    cartItems = cookieCartItems;
  }

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

  return <CartPageClient snapshot={snapshot} />;
}
