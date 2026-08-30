"use client";

import { useTransition, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe, FileText, Pencil } from "lucide-react";
import type { BlogPost } from "@/app/dashboard/_lib/types";
import {
  deleteBlogPostAction,
  publishBlogPostAction,
} from "@/app/dashboard/_lib/actions";
import { BlogFormDialog } from "./BlogFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlogManagerProps {
  publishedPosts: BlogPost[];
  draftPosts: BlogPost[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogManager({ publishedPosts, draftPosts }: BlogManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

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
            /{row.original.slug}
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
      id: "cover",
      header: "কভার ইমেজ",
      cell: ({ row }) => {
        const cover = row.original.coverImage;
        if (!cover || cover.length === 0)
          return <span className="text-xs text-muted-foreground">--</span>;
        const url = cover[0].url.startsWith("http")
          ? cover[0].url
          : `${process.env.API_URL || ""}${cover[0].url}`;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="cover"
            className="h-9 w-16 rounded object-cover border border-border/40"
          />
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

            {/* Edit */}
            <BlogFormDialog
              post={post}
              trigger={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="text-primary hover:bg-primary/10 hover:text-primary border-primary/20"
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">ব্লগ পোস্টসমূহ</h2>

        {/* Create Blog Post */}
        <BlogFormDialog
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> নতুন পোস্ট
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="published" className="gap-1.5">
            🌐 প্রকাশিত ({publishedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-1.5">
            📝 ড্রাফট ({draftPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="border-0 p-0">
          <DataTable
            columns={columns}
            data={publishedPosts}
            searchKey="title"
            searchPlaceholder="প্রকাশিত পোস্ট খুঁজুন..."
          />
        </TabsContent>

        <TabsContent value="drafts" className="border-0 p-0">
          <DataTable
            columns={columns}
            data={draftPosts}
            searchKey="title"
            searchPlaceholder="ড্রাফট পোস্ট খুঁজুন..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
