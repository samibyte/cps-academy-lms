import type { Metadata } from "next";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getBlogPosts } from "@/app/dashboard/_lib/api";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { BlogManager } from "@/app/dashboard/_components/BlogManager";

export const metadata: Metadata = {
  title: "Blog Manager",
};

export default async function CMBlogPage() {
  const { token } = await requireAuth(["Content Manager", "Admin"]);
  const [publishedRes, draftsRes] = await Promise.all([
    getBlogPosts(token, "published"),
    getBlogPosts(token, "draft"),
  ]);

  const publishedPosts = publishedRes.data || [];
  const draftPosts = (draftsRes.data || []).filter(
    (draftPost) => !publishedPosts.some((pubPost) => pubPost.documentId === draftPost.documentId)
  );

  return (
    <DashboardShell
      title="ব্লগ ম্যানেজার.md"
      description="সকল ব্লগ পোস্ট তৈরি, সম্পাদনা ও মুছে ফেলুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/content-manager" },
        { label: "ব্লগ" },
      ]}
    >
      <BlogManager
        publishedPosts={publishedPosts}
        draftPosts={draftPosts}
      />
    </DashboardShell>
  );
}
