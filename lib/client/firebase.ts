import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const firebaseConfig: FirebaseOptions = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  databaseURL: getEnv("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
};

export function hasFirebaseClientConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.appId &&
      firebaseConfig.projectId &&
      firebaseConfig.databaseURL,
  );
}

export function getFirebaseClientApp(): FirebaseApp | null {
  if (!hasFirebaseClientConfig()) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth() {
  const app = getFirebaseClientApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseClientDatabase() {
  const app = getFirebaseClientApp();
  return app ? getDatabase(app) : null;
}
