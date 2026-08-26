import { setCookie } from "./cookieUtils";

const getTokenSecondsRemaining = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    const remaining = (payload.exp ?? 0) - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
};

export const setTokenInCookies = async (
  name: string,
  token: string,
  fallbackMaxAgeInSeconds = 60 * 60 * 24, // 1 days
) => {
  const maxAgeInSeconds = getTokenSecondsRemaining(token);

  await setCookie(name, token, maxAgeInSeconds || fallbackMaxAgeInSeconds);
};
