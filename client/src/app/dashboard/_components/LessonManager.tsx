"use client";

import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/shared/FormDialog";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Lesson } from "@/app/dashboard/_lib/types";
import {
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
} from "@/app/dashboard/_lib/actions";

const lessonSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only a-z, 0-9, and dashes"),
  order: z.coerce.number().min(1, "Order must be at least 1"),
  videoUrl: z.string().optional(),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonManagerProps {
  courseId: string;
  lessons: Lesson[];
  token?: string;
}

export function LessonManager({
  courseId,
  lessons,
  token,
}: LessonManagerProps) {
  void token;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleCreate = async (values: LessonFormValues) => {
    await createLessonAction({ ...values, course: courseId });
    startTransition(() => router.refresh());
  };

  const handleUpdate = async (id: string, values: LessonFormValues) => {
    await updateLessonAction(id, values);
    startTransition(() => router.refresh());
  };

  const handleDelete = async (id: string) => {
    await deleteLessonAction(id);
    startTransition(() => router.refresh());
  };

  const columns: ColumnDef<Lesson>[] = [
    {
      accessorKey: "order",
      header: "ক্রম",
      cell: ({ row }) => (
        <span className="font-mono">{row.getValue("order")}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "লেসনের নাম",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.getValue("title")}</span>
          <span className="text-xs text-muted-foreground font-mono">
            {row.original.slug}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "videoUrl",
      header: "ভিডিও লিঙ্ক",
      cell: ({ row }) => {
        const url = row.getValue("videoUrl") as string | null;
        if (!url)
          return <span className="text-xs text-muted-foreground">--</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline max-w-50 truncate block"
          >
            {url}
          </a>
        );
      },
    },
    {
      id: "actions",
      header: "অ্যাকশন",
      cell: ({ row }) => {
        const lesson = row.original;
        const defaultValues: LessonFormValues = {
          title: lesson.title,
          slug: lesson.slug,
          order: lesson.order,
          videoUrl: lesson.videoUrl || "",
        };
        return (
          <div className="flex items-center justify-end gap-2">
            <FormDialog
              title="লেসন আপডেট"
              trigger={
                <Button variant="outline" size="icon-sm">
                  <Edit className="size-4" />
                </Button>
              }
              schema={lessonSchema}
              defaultValues={defaultValues}
              onSubmit={(vals) => handleUpdate(lesson.documentId, vals)}
            >
              {(form) => (
                <div className="grid gap-4 py-2">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">টাইটেল</label>
                    <Input {...form.register("title")} />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">স্লাগ</label>
                    <Input {...form.register("slug")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">ক্রম</label>
                      <Input type="number" {...form.register("order")} />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">
                        ভিডিও ইউআরএল
                      </label>
                      <Input
                        placeholder="Optional"
                        {...form.register("videoUrl")}
                      />
                    </div>
                  </div>
                </div>
              )}
            </FormDialog>
            <ConfirmDialog
              title="লেসন ডিলিট করবেন?"
              description="এই অ্যাকশন ফেরানো যাবে না।"
              trigger={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
              onConfirm={() => handleDelete(lesson.documentId)}
            />
          </div>
        );
      },
    },
  ];

  const nextOrder =
    lessons.length > 0 ? Math.max(...lessons.map((l) => l.order)) + 1 : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">কোর্সের কনটেন্ট</h2>
        <FormDialog
          title="নতুন লেসন"
          description="কোর্সের জন্য নতুন লেসন যুক্ত করুন"
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> লেসন যোগ করুন
            </Button>
          }
          schema={lessonSchema}
          defaultValues={{
            title: "",
            slug: "",
            order: nextOrder,
            videoUrl: "",
          }}
          onSubmit={handleCreate}
        >
          {(form) => (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">টাইটেল</label>
                <Input
                  placeholder="Intro to course"
                  {...form.register("title")}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">স্লাগ</label>
                <Input placeholder="intro-course" {...form.register("slug")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">ক্রম</label>
                  <Input type="number" {...form.register("order")} />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">ভিডিও ইউআরএল</label>
                  <Input
                    placeholder="Optional"
                    {...form.register("videoUrl")}
                  />
                </div>
              </div>
            </div>
          )}
        </FormDialog>
      </div>
      <DataTable
        columns={columns}
        data={lessons}
        searchKey="title"
        searchPlaceholder="লেসন খুঁজুন..."
      />
    </div>
  );
}
