import { setCookie } from "./cookieUtils";

export const getJwtExpiry = (token: string): number | null => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
};

export const getTokenSecondsRemaining = (token: string): number => {
  const exp = getJwtExpiry(token);
  if (!exp) return 0;

  const remaining = exp - Math.floor(Date.now() / 1000);
  return remaining > 0 ? remaining : 0;
};

export const needsTokenRefresh = (
  token: string,
  windowSeconds = 0,
): boolean => {
  const exp = getJwtExpiry(token);
  return !exp || exp <= Math.floor(Date.now() / 1000) + windowSeconds;
};

export const setTokenInCookies = async (
  name: string,
  token: string,
  fallbackMaxAgeInSeconds = 60 * 60 * 24, // 1 days
) => {
  const maxAgeInSeconds = getTokenSecondsRemaining(token);

  await setCookie(name, token, maxAgeInSeconds || fallbackMaxAgeInSeconds);
};
