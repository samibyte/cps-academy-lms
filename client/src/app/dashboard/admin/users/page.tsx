import { requireAuth } from "@/app/dashboard/_lib/auth";
import { getAdminUsers } from "@/app/dashboard/_lib/api";
import {
  updateUserRoleAction,
  toggleBlockUserAction,
  updateUserAction,
} from "@/app/dashboard/_lib/actions";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { UserTable } from "@/app/dashboard/_components/UserTable";

export default async function AdminUsersPage() {
  const { token } = await requireAuth(["Admin"]);
  const users = await getAdminUsers(token);

  return (
    <DashboardShell
      title="ব্যবহারকারী ব্যবস্থাপনা"
      description="প্ল্যাটফর্মের সকল ব্যবহারকারী এবং তাদের ভূমিকা ও অ্যাক্সেস নিয়ন্ত্রণ"
      breadcrumbs={[{ label: "অ্যাডমিন", href: "/dashboard/admin" }, { label: "ব্যবহারকারী" }]}
    >
      <div className="space-y-6">
        <UserTable
          users={users}
          updateUserRole={updateUserRoleAction}
          toggleBlockUser={toggleBlockUserAction}
          updateUser={updateUserAction}
        />
      </div>
    </DashboardShell>
  );
}
