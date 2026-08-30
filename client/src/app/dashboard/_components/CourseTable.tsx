"use client";

import { useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Pencil } from "lucide-react";
import type { Course } from "@/app/dashboard/_lib/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EditCourseDialog } from "./EditCourseDialog";
import type { InstructorSummary } from "@/app/dashboard/_lib/api";

interface CourseTableProps {
  courses: Course[];
  basePath: string;
  showOwner?: boolean;
  onDelete?: (courseId: string) => Promise<void>;
  canSelectInstructor?: boolean;
  instructors?: InstructorSummary[];
}

export function CourseTable({
  courses,
  basePath,
  showOwner,
  onDelete,
  canSelectInstructor,
  instructors,
}: CourseTableProps) {
  const columns = useMemo<ColumnDef<Course>[]>(() => {
    const cols: ColumnDef<Course>[] = [
      {
        accessorKey: "title",
        header: "কোর্সের নাম",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 min-w-50">
            <Link
              href={`${basePath}/${row.original.documentId}`}
              className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
            >
              {row.getValue("title")}
            </Link>
            <span className="text-xs text-muted-foreground font-mono truncate max-w-62.5">
              {row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "level",
        header: "লেভেল",
        cell: ({ row }) => {
          const level = row.getValue("level") as string;
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-mono capitalize"
            >
              {level}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: "স্ট্যাটাস",
        cell: ({ row }) => {
          const isPublished = !!row.original.publishedAt;
          return (
            <Badge
              variant={isPublished ? "default" : "secondary"}
              className={`text-[10px] uppercase font-bold tracking-wider scale-90 -ml-1 ${
                isPublished
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "price",
        header: "ফি (৳)",
        cell: ({ row }) => {
          const isFree = row.original.isFree;
          const price = row.getValue("price") as number;
          if (isFree || !price) {
            return (
              <Badge
                variant="outline"
                className="text-[10px] bg-primary/5 text-primary border-primary/20"
              >
                ফ্রি
              </Badge>
            );
          }
          return <span className="font-mono text-sm">৳{price}</span>;
        },
      },
    ];

    if (showOwner) {
      cols.splice(2, 0, {
        id: "owner",
        header: "ইনস্ট্রাক্টর",
        cell: ({ row }) => {
          const inst = row.original.instructor;
          if (!inst)
            return <span className="text-xs text-muted-foreground">--</span>;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {inst.fullName ?? inst.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {inst.email}
              </span>
            </div>
          );
        },
      });
    }

    cols.push({
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const id = row.original.documentId;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="icon"
              nativeButton={false}
              render={<Link href={`${basePath}/${id}`} title="ম্যানেজ কোর্স" />}
            >
              <Settings className="size-4" />
            </Button>
            <EditCourseDialog
              course={row.original}
              canSelectInstructor={!!canSelectInstructor}
              instructors={instructors || []}
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="text-primary hover:bg-primary/10 hover:text-primary border-primary/20"
                >
                  <Pencil className="size-4" />
                </Button>
              }
            />
            {onDelete && (
              <ConfirmDialog
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
                title="কোর্স মুছে ফেলবেন?"
                description={`আপনি কি নিশ্চিত "${row.original.title}" মুছে ফেলতে চান? এই অ্যাকশনটি ফেরানো যাবে না।`}
                onConfirm={() => onDelete(id)}
                confirmText="মুছে ফেলুন"
              />
            )}
          </div>
        );
      },
    });

    return cols;
  }, [basePath, showOwner, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={courses}
      searchKey="title"
      searchPlaceholder="কোর্স খুঁজুন..."
    />
  );
}
