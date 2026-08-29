"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import { createCourseAction } from "./actions";
import * as zod from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const courseSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters"),
  slug: zod.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  shortDescription: zod.string().min(10, "Short description is required"),
  level: zod.enum(["Beginner", "Intermediate", "Advanced"]),
  price: zod.coerce.number().optional(),
  isFree: zod.boolean(),
});

type CourseFormValues = zod.infer<typeof courseSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setError,
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema) as any,
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      level: "Beginner",
      isFree: true,
      price: 0,
    },
  });

  const level = watch("level");

  // @ts-ignore - TS isn't inferring the correct TFieldValues for react-hook-form
  const onSubmit: any = (values: CourseFormValues) => {
    startTransition(async () => {
      const result = await createCourseAction(values);
      if (result?.error) {
        setError("root", { message: result.error });
        return;
      }
      router.push("/dashboard/instructor/courses");
      router.refresh();
    });
  };

  return (
    <DashboardShell
      title="নতুন কোর্স তৈরি করুন"
      breadcrumbs={[
        { label: "ওভারভিউ", href: "/dashboard/instructor" },
        { label: "কোর্সসমূহ", href: "/dashboard/instructor/courses" },
        { label: "নতুন" },
      ]}
    >
      <Card className="max-w-2xl border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors.root && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {errors.root.message}
              </div>
            )}

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">কোর্সের নাম</label>
              <Input placeholder="উদাঃ Advanced DP in C++" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">স্লাগ / লিঙ্ক</label>
              <Input placeholder="উদাঃ advanced-dp-cpp" {...register("slug")} />
              <p className="text-xs text-muted-foreground">URL এ কিভাবে দেখাবে। শুধু হাইফেন ও ছোট হাতের অক্ষর।</p>
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">সংক্ষিপ্ত বিবরণ</label>
              <Textarea placeholder="কোর্সের মূল উদ্দেশ্য..." className="resize-none" {...register("shortDescription")} />
              {errors.shortDescription && <p className="text-xs text-destructive">{errors.shortDescription.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">শিক্ষার্থীর লেভেল</label>
                <Select value={level} onValueChange={(v) => setValue("level", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">বগিনার</SelectItem>
                    <SelectItem value="Intermediate">ইন্টারমিডিয়েট</SelectItem>
                    <SelectItem value="Advanced">অ্যাডভান্সড</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">ফি (টাকা, 0 = ফ্রি)</label>
                <Input
                  type="number"
                  {...register("price", {
                    onChange: (e) => {
                      const val = Number(e.target.value);
                      setValue("isFree", !val || val === 0);
                    },
                  })}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>বাতিল করুন</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "সেভ হচ্ছে..." : "কোর্স তৈরি করুন"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
