import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getBlogPosts } from "@/app/dashboard/_lib/api";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { BlogManager } from "@/app/dashboard/_components/BlogManager";

export default async function CMBlogPage() {
  const { token, me } = await requireAuth(["Content Manager", "Admin"]);
  const postsRes = await getBlogPosts(token);
  const posts = postsRes.data || [];

  return (
    <DashboardShell
      title="ব্লগ ম্যানেজার.md"
      description="সকল ব্লগ পোস্ট তৈরি, সম্পাদনা ও মুছে ফেলুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/content-manager" },
        { label: "ব্লগ" },
      ]}
    >
      <BlogManager posts={posts} authorDocId={me.documentId} token={token} />
    </DashboardShell>
  );
}
