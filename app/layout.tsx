import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const exo2 = Exo_2({
  variable: "--font-exo-2",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gifta — Premium Gift Store",
  description: "Discover premium curated gifts for every celebration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${exo2.variable} antialiased`}
      >
        <AuthSessionProvider>
          <TooltipProvider>
            <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
              <SiteShell>{children}</SiteShell>
            </ThemeProvider>
          </TooltipProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
