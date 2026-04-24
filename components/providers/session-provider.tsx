"use client";

import { SessionProvider } from "next-auth/react";
import { FirebaseBrowserNotifications } from "@/components/providers/firebase-browser-notifications";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseBrowserNotifications />
      {children}
    </SessionProvider>
  );
}
