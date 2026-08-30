"use client";

import { useTransition, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "@/components/shared/FormDialog";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe, FileText } from "lucide-react";
import type { BlogPost } from "@/app/dashboard/_lib/types";
import {
  createBlogPostAction,
  deleteBlogPostAction,
  publishBlogPostAction,
} from "@/app/dashboard/_lib/actions";

// ── Schema ────────────────────────────────────────────────────────────────────

const blogSchema = z.object({
  title: z.string().min(3, "Title required (min 3 chars)"),
  slug: z
    .string()
    .min(3, "Slug required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  excerpt: z.string().min(10, "Excerpt required (min 10 chars)"),
  publishStatus: z.enum(["draft", "publish"]).default("draft"),
});

type BlogFormValues = z.infer<typeof blogSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlogManagerProps {
  posts: BlogPost[];
  authorDocId: string;
  token?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogManager({ posts, authorDocId }: BlogManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const handleCreate = async (values: BlogFormValues) => {
    await createBlogPostAction({
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      author: authorDocId,
      body: [{ type: "paragraph", children: [{ type: "text", text: "Start writing…" }] }],
      ...(values.publishStatus === "publish" && {
        publishedAt: new Date().toISOString(),
      }),
    });
    refresh();
  };

  const handleTogglePublish = async (post: BlogPost) => {
    setTogglingId(post.documentId);
    try {
      await publishBlogPostAction(post.documentId, !post.publishedAt);
      refresh();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBlogPostAction(id);
    refresh();
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<BlogPost>[] = [
    {
      accessorKey: "title",
      header: "পোস্টের শিরোনাম",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{row.getValue("title")}</span>
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.slug}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "author",
      header: "লেখক",
      cell: ({ row }) => {
        const author = row.original.author;
        if (!author)
          return <span className="text-xs text-muted-foreground">--</span>;
        return (
          <span className="text-sm">{author.fullName || author.username}</span>
        );
      },
    },
    {
      id: "status",
      header: "স্ট্যাটাস",
      cell: ({ row }) => {
        const published = !!row.original.publishedAt;
        return (
          <Badge
            className={`text-[10px] uppercase font-bold tracking-wider ${
              published
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
            }`}
          >
            {published ? "Published" : "Draft"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "তৈরির তারিখ",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const post = row.original;
        const isPublished = !!post.publishedAt;
        const isToggling = togglingId === post.documentId;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Publish / Draft toggle */}
            <Button
              variant="outline"
              size="icon-sm"
              title={isPublished ? "Draft-এ নামিয়ে আনুন" : "Publish করুন"}
              disabled={isToggling}
              onClick={() => handleTogglePublish(post)}
              className={
                isPublished
                  ? "text-amber-600 hover:bg-amber-500/10 border-amber-500/20"
                  : "text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
              }
            >
              {isPublished ? (
                <FileText className="size-4" />
              ) : (
                <Globe className="size-4" />
              )}
            </Button>

            {/* Delete */}
            <ConfirmDialog
              title="পোস্ট ডিলিট করবেন?"
              description={`"${post.title}" — এই অ্যাকশন ফেরানো যাবে না।`}
              trigger={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
              onConfirm={() => handleDelete(post.documentId)}
            />
          </div>
        );
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">ব্লগ পোস্টসমূহ</h2>

        <FormDialog
          title="নতুন পোস্ট তৈরি করুন"
          description="বেসিক তথ্য দিন। পরে Strapi Admin থেকে পূর্ণাঙ্গ কনটেন্ট এডিট করতে পারবেন।"
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> নতুন পোস্ট
            </Button>
          }
          schema={blogSchema}
          defaultValues={{
            title: "",
            slug: "",
            excerpt: "",
            publishStatus: "draft",
          }}
          onSubmit={handleCreate}
          submitText="তৈরি করুন"
          cancelText="বাতিল"
        >
          {(form) => (
            <div className="grid gap-4 py-2">
              {/* Title */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  শিরোনাম <span className="text-destructive">*</span>
                </label>
                <Input placeholder="পোস্টের টাইটেল" {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  স্লাগ <span className="text-destructive">*</span>
                </label>
                <Input placeholder="post-slug-here" {...form.register("slug")} />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>

              {/* Excerpt */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  সংক্ষিপ্ত বিবরণ <span className="text-destructive">*</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder="পোস্টের মূল বিষয়..."
                  {...form.register("excerpt")}
                />
                {form.formState.errors.excerpt && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.excerpt.message}
                  </p>
                )}
              </div>

              {/* Publish status */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">স্ট্যাটাস</label>
                <div className="flex gap-2">
                  {(["draft", "publish"] as const).map((status) => {
                    const active = form.watch("publishStatus") === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => form.setValue("publishStatus", status)}
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
            </div>
          )}
        </FormDialog>
      </div>

      <DataTable
        columns={columns}
        data={posts}
        searchKey="title"
        searchPlaceholder="পোস্ট খুঁজুন..."
      />
    </div>
  );
}
