"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { SubmitHandler, Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as zod from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { blogSchema } from "@/zod/blog.validation";
import { createBlogPostAction, updateBlogPostAction } from "@/app/dashboard/_lib/actions";
import type { BlogPost } from "@/app/dashboard/_lib/types";

type BlogFormValues = zod.infer<typeof blogSchema>;

interface BlogFormDialogProps {
  trigger: React.ReactElement;
  post?: BlogPost; // If passed, we are EDITING. If missing, we are CREATING.
}

function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiUrl = process.env.API_URL || "";
  return `${apiUrl}${path}`;
}

function blocksToText(blocks: any[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      if (block.type === "paragraph" && Array.isArray(block.children)) {
        return block.children.map((c: any) => c.text || "").join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function BlogFormDialog({ trigger, post }: BlogFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const isEditing = !!post;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
    reset,
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema) as Resolver<BlogFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      publishStatus: "draft",
    },
  });

  // Prefill the form when opening/editing
  useEffect(() => {
    if (open) {
      if (post) {
        reset({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          body: blocksToText(post.body),
          publishStatus: post.publishedAt ? "publish" : "draft",
        });
      } else {
        reset({
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          publishStatus: "draft",
        });
      }
      setCoverImageFile(null);
    }
  }, [open, post, reset]);

  const publishStatus = watch("publishStatus");

  const coverImagePreview = useMemo(() => {
    if (coverImageFile) {
      return URL.createObjectURL(coverImageFile);
    }
    if (post?.coverImage && post.coverImage.length > 0) {
      return getMediaUrl(post.coverImage[0].url);
    }
    return null;
  }, [coverImageFile, post?.coverImage]);

  useEffect(() => {
    if (coverImageFile && coverImagePreview) {
      const url = coverImagePreview;
      return () => URL.revokeObjectURL(url);
    }
  }, [coverImageFile, coverImagePreview]);

  const onSubmit: SubmitHandler<BlogFormValues> = (values) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("slug", values.slug);
    formData.append("excerpt", values.excerpt);
    formData.append("body", values.body);
    formData.append("publishStatus", values.publishStatus);

    if (coverImageFile) {
      formData.append("coverImage", coverImageFile);
    }

    startTransition(async () => {
      const action = isEditing
        ? updateBlogPostAction(post.documentId, formData)
        : createBlogPostAction(formData);

      const result = await action;
      if (!result.success) {
        setError("root", { message: result.error });
        toast.error(`পোস্ট সংরক্ষণে ব্যর্থ: ${result.error}`);
        return;
      }

      toast.success(
        isEditing
          ? "পোস্টটি সফলভাবে আপডেট করা হয়েছে।"
          : "পোস্টটি সফলভাবে তৈরি করা হয়েছে।"
      );
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border/40 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "ব্লগ পোস্ট এডিট করুন" : "নতুন ব্লগ পোস্ট তৈরি করুন"}
          </DialogTitle>
          <DialogDescription>
            ব্লগ পোস্টের বিবরণ দিন ও সংরক্ষণ করুন।
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors.root && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {errors.root.message}
              </div>
            )}

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">শিরোনাম</label>
              <Input
                placeholder="উদাঃ How to build a NextJS web application"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">স্লাগ</label>
              <Input placeholder="উদাঃ nextjs-web-app-guide" {...register("slug")} />
              <p className="text-xs text-muted-foreground">
                URL এ যেভাবে পোস্ট দেখা যাবে। শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন।
              </p>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">সংক্ষিপ্ত বিবরণ (Excerpt)</label>
              <Textarea
                placeholder="পোস্টের কন্টেন্টের একটি ছোট বর্ণনা..."
                className="resize-none"
                rows={2}
                {...register("excerpt")}
              />
              {errors.excerpt && (
                <p className="text-xs text-destructive">
                  {errors.excerpt.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">বিস্তারিত কন্টেন্ট (Body)</label>
              <Textarea
                placeholder="এখানে আপনার সম্পূর্ণ ব্লগ পোস্ট লিখুন..."
                className="min-h-48 resize-y"
                {...register("body")}
              />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">কভার ইমেজ (Cover Image)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setCoverImageFile(e.target.files?.[0] ?? null);
                }}
              />
              {coverImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImagePreview}
                  alt="cover preview"
                  className="mt-2 h-36 w-full object-cover rounded-md border border-border/40"
                />
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">স্ট্যাটাস</label>
              <div className="flex gap-2">
                {(["draft", "publish"] as const).map((status) => {
                  const active = publishStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setValue("publishStatus", status)}
                      className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        active
                          ? status === "publish"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/40"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/40"
                          : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {status === "draft" ? "📝 Draft" : "🌐 Publish"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                বাতিল করুন
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
