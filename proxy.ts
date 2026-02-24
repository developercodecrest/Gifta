import { auth } from "@/auth";

export default auth((request) => {
  if (request.nextUrl.pathname.startsWith("/admin") && !request.auth?.user) {
    const signInUrl = new URL("/auth/sign-in", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return Response.redirect(signInUrl);
  }

  return undefined;
});

export const config = {
  matcher: ["/admin/:path*"],
};
