import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { BlocksContent, BlocksRenderer } from "@strapi/blocks-react-renderer";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";
import { Section } from "../../_components/Section";

interface BlogAuthor {
  username?: string;
  fullName?: string | null;
}

interface BlogCoverImage {
  url?: string | null;
  alternativeText?: string | null;
}

interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  body: BlocksContent;
  createdAt: string;
  publishedAt?: string | null;
  coverImage?: BlogCoverImage[] | BlogCoverImage | null;
  author?: BlogAuthor | null;
}

async function getBlogPostBySlug(slug: string) {
  const res = await apiClient<{ data: BlogPost[] }>(
    "/api/blog-posts?" +
      `filters[slug][$eq]=${encodeURIComponent(slug)}` +
      "&populate[coverImage][fields][0]=url" +
      "&populate[coverImage][fields][1]=alternativeText" +
      "&populate[author][fields][0]=username" +
      "&populate[author][fields][1]=fullName" +
      "&pagination[pageSize]=1",
    {
      cache: "force-cache",
      next: { revalidate: 60 },
    },
  );

  const items = Array.isArray(res.data) ? res.data : [];
  return items[0] ?? null;
}

function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${process.env.API_URL ?? ""}${url}`;
}

function getCoverImage(post: BlogPost) {
  const cover = Array.isArray(post.coverImage)
    ? post.coverImage[0]
    : post.coverImage;

  return cover ? normalizeImageUrl(cover.url) : null;
}

function getAuthorName(post: BlogPost) {
  return post.author?.fullName || post.author?.username || "CPS Team";
}

function formatDate(date: string | null | undefined) {
  if (!date) return "সাম্প্রতিক";
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(date));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const imageUrl = getCoverImage(post);

  return (
    <main className="flex flex-1 flex-col bg-background">
      <Section className="py-10 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="mb-6 gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
            render={
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4" />
                ব্লগে ফিরে যান
              </Link>
            }
          />

          <article className="overflow-hidden rounded-3xl border border-border/60 bg-card/50 shadow-sm">
            {imageUrl ? (
              <div className="relative h-72 overflow-hidden border-b border-border/60 sm:h-96">
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-6 p-5 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
                <span className="hidden text-muted-foreground/60 sm:inline">
                  •
                </span>
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span>{getAuthorName(post)}</span>
                </div>
              </div>

              <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {post.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  {post.excerpt}
                </p>
              </header>

              <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-28 prose-a:text-primary prose-img:rounded-xl">
                <BlocksRenderer content={post.body as BlocksContent} />
              </div>
            </div>
          </article>
        </div>
      </Section>
    </main>
  );
}
