"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { updateProfileAvatarAction } from "./actions";

type ProfileAvatarUploaderProps = {
  initialAvatar: string | null;
  userName: string;
  action: typeof updateProfileAvatarAction;
};

export function ProfileAvatarUploader({
  initialAvatar,
  userName,
  action,
}: ProfileAvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialAvatar);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ইমেজ ফাইল আপলোড করা যাবে।");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await action(formData);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        setPreview(initialAvatar);
        toast.error(result.message);
      }

      event.target.value = "";
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <Avatar
          size="lg"
          className="size-32 border-4 border-background shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)] ring-4 ring-primary/10 sm:size-36"
        >
          {preview ? <AvatarImage src={preview} alt={userName} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-3xl font-semibold text-primary-foreground sm:text-4xl">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          aria-label="প্রোফাইল ছবি আপলোড করুন"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-4 -right-3 flex size-8 items-center justify-center rounded-full border-4 border-background bg-muted text-primary shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 rounded-full"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            আপলোড হচ্ছে...
          </>
        ) : (
          <>
            <Camera className="size-3.5" />
            {initialAvatar ? "প্রোফাইল ছবি পরিবর্তন" : "প্রোফাইল ছবি আপলোড"}
          </>
        )}
      </Button>
    </div>
  );
}
