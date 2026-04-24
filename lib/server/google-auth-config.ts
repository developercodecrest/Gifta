function getTrimmedEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function toUniqueList(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => Boolean(value)),
    ),
  );
}

export function getPrimaryGoogleClientId() {
  return getTrimmedEnv("GOOGLE_WEB_CLIENT_ID") || getTrimmedEnv("GOOGLE_CLIENT_ID");
}

export function getPrimaryGoogleClientSecret() {
  return getTrimmedEnv("GOOGLE_WEB_CLIENT_SECRET") || getTrimmedEnv("GOOGLE_CLIENT_SECRET");
}

export function getGoogleAuthAudiences() {
  return toUniqueList([
    getTrimmedEnv("GOOGLE_WEB_CLIENT_ID"),
    getTrimmedEnv("GOOGLE_CLIENT_ID"),
    getTrimmedEnv("GOOGLE_ANDROID_CLIENT_ID"),
    getTrimmedEnv("GOOGLE_IOS_CLIENT_ID"),
  ]);
}

export function hasGoogleWebAuthConfig() {
  return Boolean(getPrimaryGoogleClientId() && getPrimaryGoogleClientSecret());
}

export function hasGoogleAudienceConfig() {
  return getGoogleAuthAudiences().length > 0;
}
