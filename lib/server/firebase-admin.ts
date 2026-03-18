import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

let warnedMissingConfig = false;

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrivateKey(raw: string) {
  return raw.replace(/\\n/g, "\n");
}

export function hasFirebaseAdminConfig() {
  return Boolean(
    getEnv("FIREBASE_PROJECT_ID") &&
      getEnv("FIREBASE_CLIENT_EMAIL") &&
      getEnv("FIREBASE_PRIVATE_KEY") &&
      getEnv("FIREBASE_DATABASE_URL"),
  );
}

export function getFirebaseAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0] ?? null;
  }

  if (!hasFirebaseAdminConfig()) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn("Firebase admin config is incomplete. Realtime and push emits are disabled.");
    }
    return null;
  }

  const serviceAccount: ServiceAccount = {
    projectId: getEnv("FIREBASE_PROJECT_ID"),
    clientEmail: getEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: normalizePrivateKey(getEnv("FIREBASE_PRIVATE_KEY")),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: getEnv("FIREBASE_DATABASE_URL"),
  });
}

export function getFirebaseAdminDatabase() {
  const app = getFirebaseAdminApp();
  return app ? getDatabase(app) : null;
}

export function getFirebaseAdminMessaging() {
  const app = getFirebaseAdminApp();
  return app ? getMessaging(app) : null;
}
