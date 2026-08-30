import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import { Section, SectionHeader } from "../_components/Section";
import Image from "next/image";

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
  createdAt: string;
  publishedAt?: string | null;
  coverImage?: BlogCoverImage[] | BlogCoverImage | null;
  author?: BlogAuthor | null;
}

async function getBlogPosts() {
  const res = await apiClient<{ data: BlogPost[] }>(
    "/api/blog-posts?" +
      "populate[coverImage][fields][0]=url" +
      "&populate[coverImage][fields][1]=alternativeText" +
      "&populate[author][fields][0]=username" +
      "&populate[author][fields][1]=fullName" +
      "&sort[0]=publishedAt:desc" +
      "&sort[1]=createdAt:desc" +
      "&pagination[pageSize]=12",
    {
      cache: "force-cache",
      next: { revalidate: 60 },
    },
  );

  return Array.isArray(res.data) ? res.data : [];
}

function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${process.env.API_URL ?? ""}${url}`;
}

export const metadata: Metadata = {
  title: "Blog",
};

function getCoverImage(post: BlogPost) {
  const cover = Array.isArray(post.coverImage)
    ? post.coverImage[0]
    : post.coverImage;

  return cover ? normalizeImageUrl(cover.url) : null;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "সাম্প্রতিক";
  return new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(date));
}

function getAuthorName(post: BlogPost) {
  return post.author?.fullName || post.author?.username || "CPS Team";
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="flex flex-1 flex-col bg-background">
      <Section>
        <SectionHeader
          eyebrow="// blog"
          title="ব্লগ ও আইডিয়া"
          description="কোডিং, প্র্যাকটিস, এবং সাফল্যের গল্প — আমাদের নতুন পোস্টগুলো একসাথে পড়ে নাও।"
        />

        {posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-muted-foreground">
            কোনো ব্লগ পোস্ট প্রকাশিত হয়নি।
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const imageUrl = getCoverImage(post);

              return (
                <Card
                  key={post.documentId}
                  className="group h-full overflow-hidden border-border/60 bg-card/50 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {imageUrl ? (
                    <div className="relative h-52 overflow-hidden border-b border-border/60">
                      <Image
                        src={imageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-gradient-to-br from-primary/10 via-foreground/5 to-primary/5 text-sm font-medium text-muted-foreground">
                      CPS Blog
                    </div>
                  )}

                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </div>

                    <CardTitle className="line-clamp-2 text-xl leading-snug">
                      {post.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-0">
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserRound className="h-4 w-4" />
                      <span>{getAuthorName(post)}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="mt-2 flex items-center justify-between pt-4">
                    <Badge variant="secondary" className="rounded-full">
                      Blog
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 px-0 hover:bg-transparent"
                      nativeButton={false}
                      render={
                        <Link href={`/blog/${post.slug}`}>
                          Read more
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      }
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </main>
  );
}
