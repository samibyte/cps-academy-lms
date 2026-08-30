import type { Metadata } from "next";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getBlogPosts } from "@/app/dashboard/_lib/api";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { BlogManager } from "@/app/dashboard/_components/BlogManager";

export const metadata: Metadata = {
  title: "Blog",
};

export default async function AdminBlogPage() {
  const { token, me } = await requireAuth(["Admin"]);
  const postsRes = await getBlogPosts(token);

  return (
    <DashboardShell
      title="ব্লগ ওভারসাইট.md"
      description="প্ল্যাটফর্মের সব ব্লগ পোস্ট ম্যানেজ করুন"
      breadcrumbs={[{ label: "অ্যাডমিন", href: "/dashboard/admin" }, { label: "ব্লগ" }]}
    >
      <BlogManager posts={postsRes.data || []} authorDocId={me.documentId} token={token} />
    </DashboardShell>
  );
}
