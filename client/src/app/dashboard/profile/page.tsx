import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Activity,
  ArrowLeft,
  Award,
  BookOpen,
  MailIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserInfo } from "@/services/auth.service";
import {
  getAllMyLessonProgresses,
  getAllMyQuizAttempts,
  getMyEnrollments,
} from "../student/_lib/api";
import type { LessonProgress, QuizAttempt } from "../student/_lib/types";
import { updateProfileAvatarAction } from "./actions";
import { ProfileAvatarUploader } from "./ProfileAvatarUploader";

export const metadata: Metadata = {
  title: "Profile",
};

const roleLocale: Record<string, string> = {
  Student: "শিক্ষার্থী",
  Instructor: "ইনস্ট্রাক্টর",
  "Content Manager": "কন্টেন্ট ম্যানেজার",
  Admin: "অ্যাডমিন",
};

export default async function ProfilePage() {
  const userInfo = await getUserInfo();
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!userInfo || !token) {
    redirect("/auth/login");
  }

  let enrolledCoursesCount = 0;
  let completedLessonsCount = 0;
  let passedQuizzesCount = 0;

  if (userInfo.role === "Student") {
    try {
      const [enrollmentsRes, progressesRes, attemptsRes] = await Promise.all([
        getMyEnrollments(token, userInfo.documentId),
        getAllMyLessonProgresses(token, userInfo.documentId),
        getAllMyQuizAttempts(token, userInfo.documentId),
      ]);

      enrolledCoursesCount = enrollmentsRes.data?.length ?? 0;
      completedLessonsCount =
        progressesRes.data?.filter((p: LessonProgress) => p.completed).length ??
        0;
      passedQuizzesCount =
        attemptsRes.data?.filter((a: QuizAttempt) => a.passed).length ?? 0;
    } catch (err) {
      console.error("[profile] Failed to load student progress metrics", err);
    }
  }

  const dashboardHref =
    userInfo.role === "Admin"
      ? "/dashboard/admin"
      : `/dashboard/${userInfo.role.toLowerCase().replace(" ", "-")}`;

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            nativeButton={false}
            render={
              <Link href={dashboardHref}>
                <ArrowLeft className="size-4" />
                কন্ট্রোল সেন্টারে ফিরে যান
              </Link>
            }
          />

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" />
            প্রিমিয়াম প্রোফাইল
          </div>
        </div>

        <header className="overflow-hidden rounded-[28px] border border-border/60 bg-gradient-to-br from-primary/8 via-card to-card shadow-[0_20px_60px_-40px_rgba(14,22,46,0.65)]">
          <div className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,_rgba(135,112,255,0.18),_transparent_35%),radial-gradient(circle_at_left,_rgba(78,205,196,0.14),_transparent_30%)] p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <ProfileAvatarUploader
                  initialAvatar={userInfo.avatar}
                  userName={userInfo.name}
                  action={updateProfileAvatarAction}
                />

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {roleLocale[userInfo.role] ?? userInfo.role}
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {userInfo.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {userInfo.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[340px]">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>সক্রিয়</span>
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-foreground">
                    {userInfo.role === "Student" ? "অনলাইন" : "প্রস্তুত"}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>কোর্স</span>
                    <BookOpen className="size-3.5 text-primary" />
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-foreground">
                    {enrolledCoursesCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>স্কোর</span>
                    <Award className="size-3.5 text-amber-500" />
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-foreground">
                    {passedQuizzesCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.75fr]">
          <Card className="border border-border/60 bg-card/70 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <UserIcon className="size-4 text-primary" />
                একাউন্ট সারসংক্ষেপ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  ডিসপ্লে নাম
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {userInfo.name}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-3.5">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    <MailIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      ইমেইল
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-foreground">
                      {userInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-3.5">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      রোল অ্যাক্সেস
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {userInfo.role}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/60 bg-card/70 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Settings className="size-4 text-primary" />
                  অ্যাক্টিভিটি সারাংশ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {userInfo.role === "Student" ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        <span>নথিভুক্ত</span>
                        <BookOpen className="size-3.5 text-primary" />
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-foreground">
                        {enrolledCoursesCount}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        সক্রিয় কোর্স
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        <span>লেসন</span>
                        <Activity className="size-3.5 text-primary" />
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-foreground">
                        {completedLessonsCount}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        সম্পন্ন লেসন
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        <span>কুইজ</span>
                        <Award className="size-3.5 text-amber-500" />
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-foreground">
                        {passedQuizzesCount}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        পাশকৃত মূল্যায়ন
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                    <Settings className="size-10 text-primary/50" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      প্রশাসনিক ও টিচিং টুলস প্রস্তুত হচ্ছে।
                    </p>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      রোল_স্কোপ: {userInfo.role}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/70 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  মেটাডেটা
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto rounded-2xl border border-border/60 bg-slate-950/95 p-4 font-mono text-[11px] leading-7 text-emerald-300">
                  <div>
                    <span className="text-violet-300">account:</span>
                  </div>
                  <div>
                    <span className="text-violet-300"> uuid:</span> &quot;
                    {userInfo.documentId}&quot;
                  </div>
                  <div>
                    <span className="text-violet-300"> id:</span> {userInfo.id}
                  </div>
                  <div>
                    <span className="text-violet-300"> display_name:</span>{" "}
                    &quot;
                    {userInfo.name}&quot;
                  </div>
                  <div>
                    <span className="text-violet-300"> email_address:</span>{" "}
                    &quot;
                    {userInfo.email}&quot;
                  </div>
                  <div>
                    <span className="text-violet-300"> role_type:</span> &quot;
                    {userInfo.role}&quot;
                  </div>
                  <div>
                    <span className="text-violet-300"> auth_status:</span>{" "}
                    &quot;verified&quot;
                  </div>
                  <div>
                    <span className="text-violet-300"> ui_theme:</span>{" "}
                    &quot;system_sync&quot;
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
