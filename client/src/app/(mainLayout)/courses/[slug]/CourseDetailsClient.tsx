"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Tag,
  Terminal,
  Award,
  PlayCircle,
  FolderOpen,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { type FeaturedCourse } from "../../_components/_lib/courses";
import {
  getPublicCourseBySlug,
  checkEnrollmentStatusAction,
  enrollCourseAction,
} from "../../_components/_actions/coursesActions";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<
  FeaturedCourse["level"],
  { label: string; className: string }
> = {
  BEGINNER: {
    label: "BEGINNER",
    className: "bg-cp-ac/10 text-cp-ac border-cp-ac/25",
  },
  INTERMEDIATE: {
    label: "INTERMEDIATE",
    className: "bg-cp-tle/10 text-cp-tle border-cp-tle/25",
  },
  ADVANCED: {
    label: "ADVANCED",
    className: "bg-cp-re/10 text-cp-re border-cp-re/25",
  },
};

export default function PublicCoursePage({
  slug,
  userRole,
}: {
  slug: string;
  userRole: string;
}) {
  const router = useRouter();

  const [course, setCourse] = useState<FeaturedCourse | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<
    "loading" | "unauthenticated" | "not_enrolled" | "enrolled"
  >("loading");
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [bKashOpen, setBKashOpen] = useState(false);

  const isRestrictedRole = ["Admin", "Content Manager", "Instructor"].includes(
    userRole,
  );

  // Fetch course and check enrollment status
  useEffect(() => {
    let active = true;

    getPublicCourseBySlug(slug)
      .then((courseData) => {
        if (!active) return;
        if (!courseData) {
          setIsLoadingCourse(false);
          return;
        }
        setCourse(courseData);
        setIsLoadingCourse(false);

        // Check if user is enrolled
        checkEnrollmentStatusAction(courseData.key)
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
      })
      .catch(() => {
        if (active) setIsLoadingCourse(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoadingCourse) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-32 bg-grid-cyber">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="font-mono text-xs text-muted-foreground mt-4">
          loading_course_data.log...
        </span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-32 text-center bg-grid-cyber">
        <Terminal className="h-12 w-12 text-muted-foreground/35 mb-4 font-light" />
        <h2 className="text-xl font-bold text-foreground">
          কোর্সটি খুঁজে পাওয়া যায়নি!
        </h2>
        <p className="text-sm font-mono text-muted-foreground mt-2">
          Error 404: course_not_found
        </p>
        <Link href="/courses" className="mt-6">
          <Button variant="outline" size="sm">
            কোর্স ক্যাটালগে ফিরুন
          </Button>
        </Link>
      </div>
    );
  }

  const level = LEVEL_STYLES[course.level];

  // Handle Enrollment logic
  const handleEnrollNow = async () => {
    if (enrollmentStatus === "unauthenticated") {
      toast.info("অনলাইন কোর্সে এনরোল করতে প্রথমে লগইন করুন।");
      router.push(`/auth/login?redirect=/courses/${slug}`);
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
          toast.error("এনরোলমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
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
        toast.error(
          "পেমেন্ট সম্পূর্ণ কিন্তু এনরোলমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে হেল্পডেস্কে যোগাযোগ করুন।",
        );
      }
    } catch (err) {
      toast.error("সার্ভার ত্রুটি ঘটেছে।");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col pb-16 bg-grid-cyber relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl xl:max-w-6xl w-full px-4 pt-8 space-y-8">
        {/* Navigation & Code */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/20 bg-card/10"
            nativeButton={false}
            render={
              <Link href="/courses">
                <ArrowLeft className="size-3.5" />
                সকল কোর্সে ফিরি
              </Link>
            }
          />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {course.code}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-[10px] tracking-wider",
                level.className,
              )}
            >
              {level.label}
            </Badge>
          </div>
        </div>

        {/* Title Block */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-foreground sm:text-4xl">
            {course.title}
          </h1>
          <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Info Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main info block: left columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Outline Card */}
            <Card className="border border-border/30 bg-card/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FolderOpen className="size-4.5 text-primary" />
                  কোর্স পরিচিতি ও বিস্তারিত
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                <p>
                  এই প্রোগ্রামটি বিশেষভাবে সাজানো হয়েছে প্রোগ্রামিংয়ের কোর
                  কনসেপ্ট সহজে ও প্র্যাক্টিকালি বোঝার সুবিধার্থে। প্রতি সপ্তাহে
                  থাকবে চ্যালেঞ্জিং টাস্ক ও লাইভ সেশন, যার মাধ্যমে আপনি সরাসরি
                  কনসেপ্টগুলো প্রয়োগ করতে পারবেন।
                </p>

                {course.tags && course.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono text-foreground uppercase tracking-wider">
                      ট্যাগসমূহ
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border/30 px-2 py-0.5 font-mono text-xs text-muted-foreground/80 bg-muted/50"
                        >
                          <Tag className="size-3 text-primary" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Curriculum Card */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <BookOpen className="size-5 text-primary" />
                কোর্স কন্টেন্ট ও কারিকুলাম ({course.lessons} টি লেসন)
              </h2>

              <div className="space-y-2.5">
                {Array.from({ length: course.lessons }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/35 bg-card/5 backdrop-blur-sm opacity-70"
                  >
                    <div className="shrink-0">
                      <PlayCircle className="size-5 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        <span className="text-sm font-semibold truncate text-foreground">
                          লেকচার-{idx + 1}: অধ্যায়ের বিবরণ ও প্র্যাকটিস সমস্যা
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 font-mono">
                        <Clock className="size-2.5" />
                        ৩০+ মিনিট
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono border-border/40 select-none"
                    >
                      locked
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enrollment Sidebar: right column */}
          <div className="space-y-6">
            <Card className="border border-primary/20 bg-card/15 backdrop-blur-xl overflow-hidden shadow-xl sticky top-24">
              <div className="absolute top-2 right-2 text-[9px] font-mono opacity-15 text-primary">
                enrollment.pkg
              </div>
              <CardContent className="pt-6 space-y-6">
                {/* Cost Header */}
                <div className="text-center pb-4 border-b border-border/20">
                  <span className="text-xs text-muted-foreground block font-mono">
                    কোর্স ফি
                  </span>
                  {course.isFree ? (
                    <span className="text-4xl font-extrabold font-heading text-primary block mt-1">
                      ফ্রি
                    </span>
                  ) : (
                    <span className="text-4xl font-extrabold font-heading text-foreground block mt-1">
                      ৳{course.price}
                    </span>
                  )}
                </div>

                {/* Features list */}
                <ul className="text-xs space-y-3 text-muted-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>ফুল লাইফটাইম অ্যাক্সেস</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>{course.lessons} টি কারিকুলাম লেসন</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>মোবাইল ও পিসিতে শেখার সুবিধা</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>সমস্যা সমাধানে মেন্টর সাপোর্ট</span>
                  </li>
                </ul>

                {/* Status-driven buttons */}
                <div>
                  {enrollmentStatus === "loading" ? (
                    <Button
                      disabled
                      className="w-full h-11 pointer-events-none font-semibold"
                    >
                      <Loader2 className="animate-spin mr-1.5 size-4" />
                      checking_enrollment_status...
                    </Button>
                  ) : enrollmentStatus === "enrolled" ? (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-md hover:shadow-lg"
                      nativeButton={false}
                      render={
                        <Link href={`/dashboard/student/courses/${course.key}`}>
                          কোর্সে প্রবেশ করুন
                          <ArrowRight className="size-4 ml-1.5" />
                        </Link>
                      }
                    />
                  ) : isRestrictedRole ? (
                    <Button
                      disabled
                      className="w-full h-11 font-semibold opacity-60 cursor-not-allowed"
                    >
                      এনরোল করা যাবে না
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnrollNow}
                      disabled={isEnrolling || isPending}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-11 shadow-md hover:shadow-lg"
                    >
                      {(isEnrolling || isPending) && (
                        <Loader2 className="animate-spin mr-1.5 size-4" />
                      )}
                      এখনই এনরোল করুন
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dummy bKash Modal */}
      <Dialog open={bKashOpen} onOpenChange={setBKashOpen}>
        <DialogContent className="max-w-sm overflow-hidden p-0 border border-[#E2136E]/20 bg-[#E2136E] text-white shadow-2xl rounded-2xl font-sans">
          {/* Header */}
          <div className="bg-[#E2136E] px-6 py-8 text-center flex flex-col items-center justify-center relative">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
              <span className="text-[#E2136E] text-2xl font-black italic tracking-tighter">
                bKash
              </span>
            </div>
            <h3 className="text-lg font-bold">bKash Payment Gateway</h3>
            <p className="text-white/80 text-xs mt-1 font-mono">
              Dummy Checkout System
            </p>
          </div>

          {/* Body */}
          <div className="bg-white text-gray-800 px-6 py-6 space-y-4">
            <div className="text-center bg-[#E2136E]/5 rounded-xl p-4 border border-[#E2136E]/10">
              <span className="text-xs text-gray-500 font-medium block">
                কোর্সের নাম
              </span>
              <span className="font-bold text-gray-800 line-clamp-1 mt-0.5">
                {course.title}
              </span>
              <span className="text-xs text-[#E2136E] font-mono mt-1.5 block">
                প্রদেয় টাকা:{" "}
                <strong className="text-lg font-bold">৳{course.price}</strong>
              </span>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <CheckSquare className="size-4 text-[#E2136E] shrink-0 mt-0.5" />
                <span>
                  এটি একটি ডামি পেমেন্ট সিস্টেম। Pay বাটনে ক্লিক করলে কোনো টাকা
                  কাটবে না।
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Award className="size-4 text-[#E2136E] shrink-0 mt-0.5" />
                <span>
                  পেমেন্ট সফল দেখানোর সাথে সাথে আপনি কোর্সটিতে এনরোল হয়ে
                  ড্যাশবোর্ডে চলে যাবেন।
                </span>
              </div>
            </div>

            <DialogDescription className="sr-only">
              বিকাশ গেটওয়ের মাধ্যমে পরিশোধ করুন
            </DialogDescription>

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
    </main>
  );
}
