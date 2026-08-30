"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Loader2, Tag, CheckSquare, Award } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { type FeaturedCourse } from "./_lib/courses";
import { checkEnrollmentStatusAction, enrollCourseAction } from "./_actions/coursesActions";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<FeaturedCourse["level"], { label: string; className: string }> = {
  BEGINNER: { label: "BEGINNER", className: "bg-cp-ac/10 text-cp-ac border-cp-ac/25" },
  INTERMEDIATE: {
    label: "INTERMEDIATE",
    className: "bg-cp-tle/10 text-cp-tle border-cp-tle/25",
  },
  ADVANCED: {
    label: "ADVANCED",
    className: "bg-cp-re/10 text-cp-re border-cp-re/25",
  },
};

export function CourseCardClient({ course }: { course: FeaturedCourse }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enrollmentStatus, setEnrollmentStatus] = useState<"loading" | "unauthenticated" | "not_enrolled" | "enrolled">("loading");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [bKashOpen, setBKashOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    checkEnrollmentStatusAction(course.key)
      .then((res) => {
        if (!active) return;
        if (res.status === "enrolled") {
          setEnrollmentStatus("enrolled");
        } else if (res.status === "not_enrolled") {
          setEnrollmentStatus("not_enrolled");
        } else {
          setEnrollmentStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (active) setEnrollmentStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, [course.key]);

  const level = LEVEL_STYLES[course.level];

  // Handle Enrollment logic
  const handleEnrollNow = async () => {
    if (enrollmentStatus === "unauthenticated") {
      toast.info("অনলাইন কোর্সে এনরোল করতে প্রথমে লগইন করুন।");
      router.push(`/auth/login?redirect=/courses`);
      return;
    }

    if (course.isFree) {
      setIsEnrolling(true);
      try {
        const res = await enrollCourseAction(course.key);
        if (res.success) {
          toast.success("অভিনন্দন! কোর্সটিতে সফলভাবে এনরোল করা হয়েছে।");
          setEnrollmentStatus("enrolled");
          startTransition(() => {
            router.push(`/dashboard/student/courses/${course.key}`);
          });
        } else {
          toast.error("দুঃখিত, এনরোলমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        }
      } catch (err) {
        toast.error("সার্ভার ত্রুটি ঘটেছে।");
      } finally {
        setIsEnrolling(false);
      }
    } else {
      // Trigger bKash modal for paid courses
      setBKashOpen(true);
    }
  };

  const handleBKashPayment = async () => {
    setBKashOpen(false);
    setIsEnrolling(true);
    try {
      const res = await enrollCourseAction(course.key);
      if (res.success) {
        toast.success("পেমেন্ট সফল হয়েছে! কোর্সটিতে সফলভাবে এনরোল করা হয়েছে।");
        setEnrollmentStatus("enrolled");
        startTransition(() => {
          router.push(`/dashboard/student/courses/${course.key}`);
        });
      } else {
        toast.error("পেমেন্ট সম্পূর্ণ কিন্তু এনরোলমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে সাহায্য কেন্দ্রে যোগাযোগ করুন।");
      }
    } catch (err) {
      toast.error("সার্ভার ত্রুটি ঘটেছে।");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <>
      <Card className="group/cp-course flex h-full flex-col transition-all border border-border/30 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md bg-card/20 backdrop-blur-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">{course.code}</span>
            <Badge
              variant="outline"
              className={cn("font-mono text-[10px] tracking-wider", level.className)}
            >
              {level.label}
            </Badge>
          </div>
          <CardTitle className="text-lg font-bold line-clamp-1">{course.title}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3">
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {course.tags.length > 0 ? (
              course.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 bg-muted/10"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/30">
                no_tags
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border/20 pt-4 mt-2">
          {/* Public Course Meta Info */}
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <BookOpen className="size-3 text-primary/80" />
              {course.lessons} lessons
            </span>
            {course.isFree ? (
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/25 text-[10px]"
              >
                ফ্রি
              </Badge>
            ) : (
              <span className="font-mono text-sm font-semibold text-foreground">
                ৳{course.price}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex w-full items-center gap-2">
            {enrollmentStatus === "loading" ? (
              <Button disabled className="w-full text-xs h-8 font-mono">
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                checking_enrollment...
              </Button>
            ) : enrollmentStatus === "enrolled" ? (
              <Button
                size="sm"
                className="w-full font-semibold h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                nativeButton={false}
                render={
                  <Link href={`/dashboard/student/courses/${course.key}`}>
                    কোর্সে প্রবেশ করুন
                    <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                }
              />
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-1/2 font-semibold h-8 text-xs hover:bg-muted/10 border-border/40"
                  onClick={() => setDetailsOpen(true)}
                >
                  বিস্তারিত
                </Button>
                <Button
                  size="sm"
                  className="w-1/2 font-semibold h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isEnrolling || isPending}
                  onClick={handleEnrollNow}
                >
                  {(isEnrolling || isPending) ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : null}
                  এনরোল করুন
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md border border-border/30 bg-popover text-foreground p-6 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{course.code}</span>
              <Badge variant="outline" className={cn("font-mono text-[10px] tracking-wider", level.className)}>
                {level.label}
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold font-heading">{course.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2 text-sm">
            <div>
              <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">কোর্স পরিচিতি</h4>
              <p className="leading-relaxed text-muted-foreground/90">{course.description}</p>
            </div>

            <div className="flex justify-between border-t border-b border-border/20 py-2.5 my-1">
              <div>
                <span className="text-xs font-mono text-muted-foreground block">লেসন সংখ্যা</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <BookOpen className="size-3.5 text-primary" />
                  {course.lessons} টি লেসন
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-muted-foreground block">কোর্স ফি</span>
                <span className="font-semibold text-foreground block mt-0.5">
                  {course.isFree ? "ফ্রি" : `৳${course.price}`}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">যা যা শিখবো</h4>
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md border border-border/40 px-2 py-0.5 font-mono text-xs text-muted-foreground/80 bg-muted/10"
                  >
                    <Tag className="size-3 text-primary/70" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <DialogDescription className="sr-only">কোর্স এর বিস্তারিত বিবরণী</DialogDescription>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/10">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="h-9 px-4 text-xs font-semibold">
              বন্ধ করুন
            </Button>
            {enrollmentStatus !== "enrolled" && (
              <Button onClick={() => { setDetailsOpen(false); handleEnrollNow(); }} disabled={isEnrolling} className="h-9 px-4 text-xs font-semibold">
                এখনই এনরোল করুন
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dummy bKash Modal */}
      <Dialog open={bKashOpen} onOpenChange={setBKashOpen}>
        <DialogContent className="max-w-sm overflow-hidden p-0 border border-[#E2136E]/20 bg-[#E2136E] text-white shadow-2xl rounded-2xl font-sans">
          {/* Header */}
          <div className="bg-[#E2136E] px-6 py-8 text-center flex flex-col items-center justify-center relative">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
              <span className="text-[#E2136E] text-2xl font-black italic tracking-tighter">bKash</span>
            </div>
            <h3 className="text-lg font-bold">bKash Payment Gateway</h3>
            <p className="text-white/80 text-xs mt-1 font-mono">Dummy Checkout System</p>
          </div>

          {/* Body */}
          <div className="bg-white text-gray-800 px-6 py-6 space-y-4">
            <div className="text-center bg-[#E2136E]/5 rounded-xl p-4 border border-[#E2136E]/10">
              <span className="text-xs text-gray-500 font-medium block">কোর্সের নাম</span>
              <span className="font-bold text-gray-800 line-clamp-1 mt-0.5">{course.title}</span>
              <span className="text-xs text-[#E2136E] font-mono mt-1.5 block">প্রদেয় টাকা: <strong className="text-lg font-bold">৳{course.price}</strong></span>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <CheckSquare className="size-4 text-[#E2136E] shrink-0 mt-0.5" />
                <span>এটি একটি ডামি পেমেন্ট সিস্টেম। Pay বাটনে ক্লিক করলে কোনো টাকা কাটবে না।</span>
              </div>
              <div className="flex items-start gap-2">
                <Award className="size-4 text-[#E2136E] shrink-0 mt-0.5" />
                <span>পেমেন্ট সফল দেখানোর সাথে সাথে আপনি কোর্সটিতে এনরোল হয়ে ড্যাশবোর্ডে চলে যাবেন।</span>
              </div>
            </div>

            <DialogDescription className="sr-only">বিকাশ গেটওয়ের মাধ্যমে পরিশোধ করুন</DialogDescription>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full bg-[#E2136E] hover:bg-[#c90d5e] text-white font-bold h-10 shadow-md hover:shadow-lg transition duration-200"
                onClick={handleBKashPayment}
              >
                Pay ৳{course.price} with bKash
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 text-gray-500 font-semibold h-10 transition duration-200"
                onClick={() => setBKashOpen(false)}
              >
                বাতিল করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
