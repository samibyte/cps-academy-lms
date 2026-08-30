"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Badge } from "@/components/ui/badge";
import type { Enrollment, LessonProgress } from "@/app/dashboard/_lib/types";

interface StudentProgressTableProps {
  enrollments: Enrollment[];
  progress: LessonProgress[];
  totalLessons: number;
}

export function StudentProgressTable({
  enrollments,
  progress,
  totalLessons,
}: StudentProgressTableProps) {
  // Aggregate progress per student
  const progressMap = progress.reduce(
    (acc, p) => {
      if (!p.student?.documentId) return acc;
      const docId = p.student.documentId;
      if (!acc[docId]) acc[docId] = 0;
      if (p.completed) acc[docId] += 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const columns: ColumnDef<Enrollment>[] = [
    {
      accessorKey: "student",
      header: "শিক্ষার্থী",
      cell: ({ row }) => {
        const student = row.original.student;
        if (!student)
          return <span className="text-muted-foreground text-xs">অজ্ঞাত</span>;
        return (
          <div className="flex flex-col">
            <span className="font-semibold">
              {student.fullName || student.username}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              @{student.username}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "এনরোলমেন্ট স্ট্যাটাস",
      cell: ({ row }) => {
        const status = row.original.enrollment_status;
        return (
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "completed"
                  ? "secondary"
                  : "destructive"
            }
            className="text-[10px] uppercase font-bold tracking-wider"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "লার্নিং অগ্রগতি",
      cell: ({ row }) => {
        const studentDocId = row.original.student?.documentId;
        const completedCount = studentDocId
          ? progressMap[studentDocId] || 0
          : 0;

        return (
          <div className="w-[180px]">
            <ProgressBar
              value={completedCount}
              max={totalLessons || 1}
              showLabel
              unit="lessons"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "enrolledAt",
      header: "এনরোল করেছে",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "lastAccessed",
      header: "সবশেষ অ্যাক্টিভিটি",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.original.lastAccessedAt
            ? new Date(row.original.lastAccessedAt).toLocaleDateString()
            : "কখনো না"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">শিক্ষার্থীদের অগ্রগতি রিপোর্ট</h2>
      </div>
      <DataTable columns={columns} data={enrollments} />
    </div>
  );
}
