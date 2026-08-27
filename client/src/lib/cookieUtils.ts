"use server";

import { cookies } from "next/headers";

export const setCookie = async (
  name: string,
  value: string,
  maxAgeInSeconds: number,
) => {
  const cookieStore = await cookies();

  let httpSecure = true;
  if (process.env.NODE_ENV === "development") {
    httpSecure = false;
  }

  cookieStore.set(name, value, {
    httpOnly: true,
    secure: httpSecure,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeInSeconds,
  });
};

export const getCookie = async (name: string) => {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
};

export const deleteCookie = async (name: string) => {
  const cookieStore = await cookies();
  cookieStore.delete(name);
};
