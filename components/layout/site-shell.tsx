import { LoginPopup } from "@/components/auth/login-popup";
import { ProfileOnboardingGate } from "@/components/auth/profile-onboarding-gate";
import { CartSyncGate } from "@/components/cart/cart-sync-gate";
import { Footer } from "@/components/layout/site-footer";
import { Header } from "@/components/layout/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-80 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <CartSyncGate />
      <ProfileOnboardingGate />
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </main>
      <Footer />
      <LoginPopup />
    </div>
  );
}
