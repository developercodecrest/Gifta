import { auth } from "@/auth";
import { parseRole } from "@/lib/roles";

export default auth((request) => {
  if (request.nextUrl.pathname.startsWith("/admin") && !request.auth?.user) {
    const signInUrl = new URL("/auth/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return Response.redirect(signInUrl);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && request.auth?.user) {
    const role = parseRole(request.auth.user.role as string | undefined);
    if (role !== "SADMIN" && role !== "STORE_OWNER") {
      const homeUrl = new URL("/", request.nextUrl.origin);
      homeUrl.searchParams.set("access", "denied");
      return Response.redirect(homeUrl);
    }
  }

  return undefined;
});

export const config = {
  matcher: ["/admin/:path*"],
};
