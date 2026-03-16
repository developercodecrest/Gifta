"use client";

import { usePathname } from "next/navigation";
import { LoginPopup } from "@/components/auth/login-popup";
import { ProfileOnboardingGate } from "@/components/auth/profile-onboarding-gate";
import { CartSyncGate } from "@/components/cart/cart-sync-gate";
import { Footer } from "@/components/layout/site-footer";
import { Header } from "@/components/layout/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-80 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <CartSyncGate />
      <ProfileOnboardingGate />
      {isAdminRoute ? null : <Header />}
      <main id="main-content" className="page-gutter w-full">
        {children}
      </main>
      {isAdminRoute ? null : <Footer />}
      <LoginPopup />
    </div>
  );
}
