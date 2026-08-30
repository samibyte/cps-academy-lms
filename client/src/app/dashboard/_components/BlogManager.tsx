"use client";

import { useTransition } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import type { BlogPost } from "@/app/dashboard/_lib/types";
import {
  createBlogPostAction,
  deleteBlogPostAction,
} from "@/app/dashboard/_lib/actions";

const blogSchema = z.object({
  title: z.string().min(3, "Title required"),
  slug: z
    .string()
    .min(3, "Slug required")
    .regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(10, "Excerpt required"),
});

type BlogFormValues = z.infer<typeof blogSchema>;

interface BlogManagerProps {
  posts: BlogPost[];
  authorDocId: string;
  token?: string;
}

export function BlogManager({ posts, authorDocId, token }: BlogManagerProps) {
  void token;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleCreate = async (values: BlogFormValues) => {
    await createBlogPostAction({
      ...values,
      author: authorDocId,
      body: [
        {
          type: "paragraph",
          children: [{ type: "text", text: "Start writing..." }],
        },
      ],
    });
    startTransition(() => router.refresh());
  };

  const handleDelete = async (id: string) => {
    await deleteBlogPostAction(id);
    startTransition(() => router.refresh());
  };

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
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <ConfirmDialog
            title="পোস্ট ডিলিট করবেন?"
            description={`"${row.original.title}" — এই অ্যাকশন ফেরানো যাবে না।`}
            trigger={
              <Button
                variant="outline"
                size="icon-sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              >
                <Trash2 className="size-4" />
              </Button>
            }
            onConfirm={() => handleDelete(row.original.documentId)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">ব্লগ পোস্টসমূহ</h2>
        <FormDialog
          title="নতুন পোস্ট তৈরি করুন"
          description="বেসিক তথ্য দিন, পরে Strapi Admin থেকে সম্পূর্ণ কনটেন্ট এডিট করতে পারবেন।"
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> নতুন পোস্ট
            </Button>
          }
          schema={blogSchema}
          defaultValues={{ title: "", slug: "", excerpt: "" }}
          onSubmit={handleCreate}
        >
          {(form) => (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">শিরোনাম</label>
                <Input
                  placeholder="পোস্টের টাইটেল"
                  {...form.register("title")}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">স্লাগ</label>
                <Input placeholder="post-slug" {...form.register("slug")} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">সংক্ষিপ্ত বিবরণ</label>
                <Textarea
                  placeholder="পোস্টের মূল বিষয়..."
                  {...form.register("excerpt")}
                />
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
