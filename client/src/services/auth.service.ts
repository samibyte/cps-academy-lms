import "server-only";
import { cookies } from "next/headers";
import { apiClient, ApiError } from "@/lib/apiClient";
import { redirect } from "next/navigation";

// Types

/** Strapi role names used across the LMS. */
export type StrapiRole =
  | "Student"
  | "Instructor"
  | "Content Manager"
  | "Admin"
  | string;

export interface UserInfo {
  id: number;
  documentId: string;
  name: string;
  email: string;
  role: StrapiRole;
  avatar: string | null;
}

//Internal Strapi shape

interface StrapiMe {
  id: number;
  documentId: string;
  username: string;
  fullName: string | null;
  email: string;
  role: { name: string };
  avatar?: { url: string } | null;
}

// Service

/**
 * Server-side helper: reads the `accessToken` cookie, calls
 * `GET /api/users/me?populate=role,avatar`, and returns a normalized
 * `UserInfo` object. Returns `null` if no token or the request fails
 * (middleware will have already redirected, but this acts as a fallback).
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;

  try {
    const me = await apiClient<StrapiMe>("/api/users/me?populate=role,avatar", {
      token,
    });

    const STRAPI_URL = process.env.API_URL ?? "";
    const avatarPath = me.avatar?.url ?? null;
    const avatar =
      avatarPath === null
        ? null
        : avatarPath.startsWith("http")
          ? avatarPath
          : `${STRAPI_URL}${avatarPath}`;

    return {
      id: me.id,
      documentId: me.documentId,
      name: me.fullName ?? me.username,
      email: me.email,
      role: me.role.name,
      avatar,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/auth/login");
    }
    return null;
  }
}
