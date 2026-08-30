import type { Metadata } from "next";
import { requireAuth } from "@/app/dashboard/_lib/auth";
import { apiClient } from "@/lib/apiClient";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { StatCard } from "@/components/shared/StatCard";
import { Users, BookOpen, GraduationCap, CheckSquare, ShieldCheck } from "lucide-react";

interface StatsData {
  data: {
    usersByRole: Record<string, number>;
    totalCourses: number;
    totalEnrollments: number;
    totalQuizAttempts: number;
  };
}

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminOverviewPage() {
  const { token } = await requireAuth(["Admin"]);

  let stats: StatsData["data"] | null = null;
  try {
    const res = await apiClient<StatsData>("/api/admin/stats", { token });
    stats = res.data;
  } catch (err) {
    console.error("[admin] Failed to fetch stats", err);
  }

  const usersByRole = stats?.usersByRole ?? {};
  const totalUsers = Object.values(usersByRole).reduce((s, v) => s + v, 0);

  return (
    <DashboardShell
      title="অ্যাডমিন ওভারভিউ.cpp"
      description="প্ল্যাটফর্মের সার্বিক পরিসংখ্যান"
      breadcrumbs={[{ label: "অ্যাডমিন" }]}
    >
      <div className="space-y-8">
        {/* Platform-wide counters */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">প্ল্যাটফর্ম</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="মোট ব্যবহারকারী" value={totalUsers} icon={Users} />
            <StatCard label="মোট কোর্স" value={stats?.totalCourses ?? "--"} icon={BookOpen} />
            <StatCard label="মোট এনরোলমেন্ট" value={stats?.totalEnrollments ?? "--"} icon={GraduationCap} />
            <StatCard label="কুইজ অ্যাটেম্পট" value={stats?.totalQuizAttempts ?? "--"} icon={CheckSquare} />
          </div>
        </div>

        {/* Users by role */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">ভূমিকা অনুযায়ী ব্যবহারকারী</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(usersByRole).map(([role, count]) => (
              <StatCard
                key={role}
                label={role}
                value={count}
                icon={ShieldCheck}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
