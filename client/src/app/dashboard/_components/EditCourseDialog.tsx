"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { SubmitHandler, Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as zod from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import { courseSchema } from "@/zod/course.validation";
import { updateCourseAction } from "@/app/dashboard/_lib/actions";
import type { Course } from "@/app/dashboard/_lib/types";
import type { InstructorSummary } from "@/app/dashboard/_lib/api";

type CourseFormValues = zod.infer<typeof courseSchema>;

interface EditCourseDialogProps {
  trigger: React.ReactElement;
  course: Course;
  canSelectInstructor: boolean;
  instructors: InstructorSummary[];
}

function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiUrl = process.env.API_URL || "";
  return `${apiUrl}${path}`;
}

function blocksToText(blocks: any[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks
    .map((block) => {
      if (block.type === "paragraph" && Array.isArray(block.children)) {
        return block.children.map((c: any) => c.text || "").join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function EditCourseDialog({
  trigger,
  course,
  canSelectInstructor,
  instructors,
}: EditCourseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState(() => (course.tags ?? []).join(", "));

  const parseTagInput = (value: string) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    setError,
    reset,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema) as Resolver<CourseFormValues>,
    defaultValues: {
      title: course.title || "",
      slug: course.slug || "",
      shortDescription: course.shortDescription || "",
      description: blocksToText(course.description),
      level: course.level || "Beginner",
      isFree: course.isFree ?? true,
      price: course.price ?? 0,
      isFeatured: course.isFeatured ?? false,
      tags: course.tags ?? [],
      instructor: course.instructor?.documentId || "",
    },
  });

  // Reset form with current course values when modal opens
  useEffect(() => {
    if (open) {
      reset({
        title: course.title || "",
        slug: course.slug || "",
        shortDescription: course.shortDescription || "",
        description: blocksToText(course.description),
        level: course.level || "Beginner",
        isFree: course.isFree ?? true,
        price: course.price ?? 0,
        isFeatured: course.isFeatured ?? false,
        tags: course.tags ?? [],
        instructor: course.instructor?.documentId || "",
      });
      setTagInput((course.tags ?? []).join(", "));
      setThumbnailFile(null);
    }
  }, [open, course, reset]);

  const level = watch("level");
  const thumbnailPreview = useMemo(() => {
    if (thumbnailFile) {
      return URL.createObjectURL(thumbnailFile);
    }
    return getMediaUrl(course.thumbnail?.url);
  }, [thumbnailFile, course.thumbnail?.url]);

  useEffect(() => {
    if (thumbnailFile && thumbnailPreview) {
      const url = thumbnailPreview;
      return () => URL.revokeObjectURL(url);
    }
  }, [thumbnailFile, thumbnailPreview]);

  const handleInstructorChange = (documentId: string) => {
    setValue("instructor", documentId);
  };

  const onSubmit: SubmitHandler<CourseFormValues> = (values) => {
    const formData = new FormData();
    const parsedTags = parseTagInput(tagInput);

    formData.append("title", values.title);
    formData.append("slug", values.slug);
    formData.append("shortDescription", values.shortDescription);
    formData.append("description", values.description ?? "");
    formData.append("level", values.level);
    formData.append("price", String(values.price ?? 0));
    formData.append("isFree", String(values.isFree));
    formData.append("isFeatured", String(values.isFeatured));
    formData.append("tags", JSON.stringify(parsedTags));
    setValue("tags", parsedTags);
    if (values.instructor) formData.append("instructor", values.instructor);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    startTransition(async () => {
      const result = await updateCourseAction(course.documentId, formData);
      if (!result.success) {
        setError("root", { message: result.error });
        toast.error(`আপডেট করতে ব্যর্থ: ${result.error}`);
        return;
      }
      toast.success("কোর্সটি সফলভাবে আপডেট করা হয়েছে।");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-border/40 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>কোর্স এডিট করুন</DialogTitle>
          <DialogDescription>
            কোর্সের বিবরণ পরিবর্তন করুন ও নিচে সেভ বোতাম চাপুন।
          </DialogDescription>
        </DialogHeader>
        <CardContent className="p-0 pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors.root && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {errors.root.message}
              </div>
            )}

            {canSelectInstructor && (
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">ইনস্ট্রাক্টর</label>
                {instructors.length === 0 ? (
                  <p className="text-sm text-muted-foreground border border-dashed border-border/40 rounded-md px-3 py-2">
                    কোনো ইনস্ট্রাক্টর পাওয়া যায়নি।
                  </p>
                ) : (
                  <Controller
                    name="instructor"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => handleInstructorChange(v ?? "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ইনস্ট্রাক্টর নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem
                              key={instructor.documentId}
                              value={instructor.documentId}
                            >
                              {instructor.fullName || instructor.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {errors.instructor && (
                  <p className="text-xs text-destructive">
                    {errors.instructor.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">কোর্সের নাম</label>
              <Input
                placeholder="উদাঃ Advanced DP in C++"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">স্লাগ / লিঙ্ক</label>
              <Input placeholder="উদাঃ advanced-dp-cpp" {...register("slug")} />
              <p className="text-xs text-muted-foreground">
                URL এ কিভাবে দেখাবে। শুধু হাইফেন ও ছোট হাতের অক্ষর।
              </p>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">সংক্ষিপ্ত বিবরণ</label>
              <Textarea
                placeholder="কোর্সের মূল উদ্দেশ্য..."
                className="resize-none"
                {...register("shortDescription")}
              />
              {errors.shortDescription && (
                <p className="text-xs text-destructive">
                  {errors.shortDescription.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">বিস্তারিত বিবরণ</label>
              <Textarea
                placeholder="কোর্স সম্পর্কে বিস্তারিত লিখুন..."
                className="min-h-28 resize-y"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">শিক্ষার্থীর লেভেল</label>
                <Select
                  value={level}
                  onValueChange={(v) =>
                    setValue("level", v as CourseFormValues["level"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">বিগিনার</SelectItem>
                    <SelectItem value="Intermediate">ইন্টারমিডিয়েট</SelectItem>
                    <SelectItem value="Advanced">অ্যাডভান্সড</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">ফি (টাকা, 0 = ফ্রি)</label>
                <Input
                  type="number"
                  min={0}
                  {...register("price", {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const val = Number(e.target.value);
                      setValue("isFree", !val || val === 0);
                    },
                  })}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">ট্যাগসমূহ</label>
              <Input
                placeholder="উদাঃ c++, algorithm, dp"
                value={tagInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setTagInput(nextValue);
                  setValue("tags", parseTagInput(nextValue));
                }}
              />
              <p className="text-xs text-muted-foreground">
                কমা দিয়ে আলাদা করুন।
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">থাম্বনেইল ছবি</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setThumbnailFile(e.target.files?.[0] ?? null);
                }}
              />
              {thumbnailPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailPreview}
                  alt="thumbnail preview"
                  className="mt-2 h-36 w-full object-cover rounded-md border border-border/40"
                />
              )}
            </div>

            {canSelectInstructor && (
              <div className="flex items-center gap-2">
                <Controller
                  name="isFeatured"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="is-featured-edit"
                      />
                      <Label
                        htmlFor="is-featured-edit"
                        className="text-sm font-medium"
                      >
                        ফিচার্ড কোর্স হিসেবে দেখান
                      </Label>
                    </>
                  )}
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                বাতিল করুন
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </div>
          </form>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
