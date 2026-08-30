"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { AdminUser } from "@/app/dashboard/_lib/types";

interface UserTableProps {
  users: AdminUser[];
  updateUserRole: (documentId: string, role: string) => Promise<{ success: boolean; error?: string }>;
  toggleBlockUser: (documentId: string) => Promise<{ success: boolean; error?: string; blocked?: boolean }>;
  updateUser: (documentId: string, data: { fullName: string; username: string; email: string }) => Promise<{ success: boolean; error?: string }>;
}

const editUserSchema = z.object({
  fullName: z.string().min(1, "নাম আবশ্যক"),
  username: z.string().min(3, "ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে"),
  email: z.string().email("সঠিক ইমেইল ঠিকানা দিন"),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export function UserTable({
  users,
  updateUserRole,
  toggleBlockUser,
  updateUser,
}: UserTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // For role confirmations
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: AdminUser;
    newRole: string;
  } | null>(null);

  const handleRoleChangeConfirm = async () => {
    if (!pendingRoleChange) return;
    const { user, newRole } = pendingRoleChange;

    const res = await updateUserRole(user.documentId, newRole);
    if (res.success) {
      toast.success(`"${user.fullName ?? user.username}" এর রোল পরিবর্তন করে "${newRole}" করা হয়েছে।`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      toast.error(`রোল পরিবর্তন করতে ব্যর্থ হয়েছে: ${res.error}`);
    }
    setPendingRoleChange(null);
  };

  const handleToggleBlock = async (user: AdminUser) => {
    const res = await toggleBlockUser(user.documentId);
    if (res.success) {
      const statusText = res.blocked ? "ব্লক" : "আনব্লক";
      toast.success(`ব্যবহারকারীকে সফলভাবে ${statusText} করা হয়েছে।`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      toast.error(`অ্যাকশনটি ব্যর্থ হয়েছে: ${res.error}`);
    }
  };

  const handleUpdateUser = async (user: AdminUser, values: EditUserFormValues) => {
    const res = await updateUser(user.documentId, values);
    if (res.success) {
      toast.success("ব্যবহারকারীর তথ্য সফলভাবে আপডেট করা হয়েছে।");
      startTransition(() => {
        router.refresh();
      });
    } else {
      toast.error(`তথ্য আপডেট করতে ব্যর্থ হয়েছে: ${res.error}`);
    }
  };

  const columns = useMemo<ColumnDef<AdminUser>[]>(() => {
    return [
      {
        accessorKey: "username",
        header: "ব্যবহারকারী",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">
                {user.fullName ?? user.username}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                @{user.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "ভূমিকা",
        cell: ({ row }) => {
          const user = row.original;
          const roles = ["Student", "Instructor", "Content Manager", "Admin"];

          return (
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role.name} />
              <NativeSelect
                value={user.role.name}
                onChange={(e) => {
                  setPendingRoleChange({
                    user,
                    newRole: e.target.value,
                  });
                  setTimeout(() => {
                    document.getElementById("trigger-role-confirm")?.click();
                  }, 0);
                }}
                size="sm"
                className="w-32 scale-90"
              >
                {roles.map((r) => (
                  <NativeSelectOption key={r} value={r}>
                    {r}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          );
        },
      },
      {
        accessorKey: "blocked",
        header: "স্ট্যাটাস",
        cell: ({ row }) => {
          const isBlocked = row.original.blocked;
          return (
            <Badge
              variant={isBlocked ? "destructive" : "default"}
              className={`text-[10px] uppercase font-bold tracking-wider ${
                isBlocked
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              }`}
            >
              {isBlocked ? "Blocked" : "Active"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "যুক্ত হয়েছেন",
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <span className="text-xs font-mono text-muted-foreground">
              {date.toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "অ্যাকশন",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2 justify-end">
              {/* Form Dialog for editing basic info */}
              <FormDialog<EditUserFormValues>
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                }
                title="ব্যবহারকারীর তথ্য পরিবর্তন"
                description={`"${user.fullName ?? user.username}" এর বিবরণী পরিবর্তন করুন`}
                schema={editUserSchema}
                defaultValues={{
                  fullName: user.fullName ?? "",
                  username: user.username,
                  email: user.email,
                }}
                onSubmit={(values) => handleUpdateUser(user, values)}
                submitText="সংরক্ষণ করুন"
                cancelText="বাতিল"
              >
                {(form) => (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">সম্পূর্ণ নাম</Label>
                      <Input
                        id="fullName"
                        placeholder="জন ডো"
                        {...form.register("fullName")}
                        className={form.formState.errors.fullName ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      />
                      {form.formState.errors.fullName && (
                        <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="username">ইউজারনেম</Label>
                      <Input
                        id="username"
                        placeholder="johndoe"
                        {...form.register("username")}
                        className={form.formState.errors.username ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      />
                      {form.formState.errors.username && (
                        <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">ইমেইল ঠিকানা</Label>
                      <Input
                        id="email"
                        placeholder="john@example.com"
                        type="email"
                        {...form.register("email")}
                        className={form.formState.errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
                      />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </FormDialog>

              {/* Block/Unblock toggle button */}
              <Button
                variant="outline"
                size="icon"
                className={`size-8 ${
                  user.blocked
                    ? "text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-500 hover:bg-rose-500/10 border-rose-500/20"
                }`}
                onClick={() => handleToggleBlock(user)}
                title={user.blocked ? "আনব্লক করুন" : "ব্লক করুন"}
              >
                {user.blocked ? (
                  <ShieldCheck className="size-3.5" />
                ) : (
                  <ShieldAlert className="size-3.5" />
                )}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [updateUserRole, toggleBlockUser, updateUser]);

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        searchKey="username"
        searchPlaceholder="ইউজারনেম দিয়ে খুঁজুন..."
      />

      <ConfirmDialog
        trigger={<button id="trigger-role-confirm" className="hidden" />}
        title="ভূমিকা পরিবর্তনের নিশ্চয়তা"
        description={
          pendingRoleChange
            ? `আপনি কি নিশ্চিত যে "${
                pendingRoleChange.user.fullName ?? pendingRoleChange.user.username
              }" এর ভূমিকা পরিবর্তন করে "${pendingRoleChange.newRole}" করতে চান?`
            : "ভূমিকা পরিবর্তন করতে চান?"
        }
        onConfirm={handleRoleChangeConfirm}
        confirmText="নিশ্চিত করুন"
        cancelText="বাতিল"
        isDestructive={false}
      />
    </>
  );
}
