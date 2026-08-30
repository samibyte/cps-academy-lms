"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/apiClient";

async function uploadAvatarToStrapi(
  file: File,
  token: string,
): Promise<number> {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetch(`${process.env.API_URL}/api/upload`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(
      payload?.error?.message ??
        payload?.message ??
        "প্রোফাইল ছবি আপলোড করতে ব্যর্থ হয়েছে।",
    );
  }

  const uploaded = (await res.json()) as Array<{
    id: number;
    url?: string;
    name?: string;
  }>;

  const media = Array.isArray(uploaded) ? uploaded[0] : uploaded;

  if (!media?.id) {
    throw new Error("আপলোড করা ছবিটি যাচাই করা যায়নি।");
  }

  return media.id;
}

export async function updateProfileAvatarAction(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const file = formData.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return {
        success: false,
        message: "আপলোডের জন্য একটি ছবি নির্বাচন করুন।",
      };
    }

    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        message: "শুধু ইমেজ ফাইল আপলোড করা যাবে।",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return {
        success: false,
        message: "লগইন করা প্রয়োজন।",
      };
    }

    const mediaId = await uploadAvatarToStrapi(file, token);

    await apiClient("/api/users/me/avatar", {
      method: "PUT",
      token,
      body: { avatar: mediaId },
    });

    revalidatePath("/dashboard/profile");

    return {
      success: true,
      message: "প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে।",
    };
  } catch (error) {
    console.error("[profile-avatar-upload]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "প্রোফাইল ছবি আপডেট করতে ব্যর্থ হয়েছে।",
    };
  }
}
