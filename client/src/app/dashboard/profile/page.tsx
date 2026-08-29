import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getUserInfo } from "@/services/auth.service";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  MailIcon,
  ShieldIcon,
  Terminal,
  Activity,
  Award,
  BookOpen,
  ArrowLeft,
  Settings,
} from "lucide-react";
import {
  getMyEnrollments,
  getAllMyLessonProgresses,
  getAllMyQuizAttempts,
} from "../student/_lib/api";
import { LessonProgress, QuizAttempt } from "../student/_lib/types";

export default async function ProfilePage() {
  const userInfo = await getUserInfo();
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!userInfo || !token) {
    redirect("/auth/login");
  }

  // 1. Role-based stats checking (conditionally loading student data)
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

  // Map roles to Bengali titles
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "Student":
        return "শিক্ষার্থী";
      case "Instructor":
        return "ইনস্ট্রাক্টর";
      case "Content Manager":
        return "কন্টেন্ট ম্যানেজার";
      case "Admin":
        return "অ্যাডমিন";
      default:
        return role;
    }
  };

  return (
    <div className="relative p-6 sm:p-8 min-h-screen bg-grid-cyber">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl xl:max-w-6xl w-full space-y-8">
      {/* Breadcrumb back navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          nativeButton={false}
          render={
            <Link
              href={
                userInfo.role === "Admin"
                  ? "/dashboard/admin"
                  : `/dashboard/${userInfo.role.toLowerCase().replace(" ", "-")}`
              }
            >
              <ArrowLeft className="size-3.5" />
              কন্ট্রোল সেন্টারে ফিরে যান
            </Link>
          }
        />
      </div>

      {/* Page Header */}
      <PageHeader
        title="আমার প্রোফাইল.json"
        description="তোমার অ্যাকাউন্টের ব্যক্তিগত ইনফরমেশন এবং প্ল্যাটফর্ম অ্যাক্টিভিটি রিপোর্ট।"
        className="mb-8"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Account details summary card */}
        <div className="space-y-6">
          <Card className="border border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden transition-all hover:border-primary/10">
            {/* Stack graphic decorations */}
            <svg
              className="absolute right-4 bottom-0 h-16 w-16 opacity-10 pointer-events-none stroke-primary"
              viewBox="0 0 100 100"
              fill="none"
            >
              <rect x="10" y="10" width="80" height="20" strokeWidth="2" />
              <rect x="10" y="30" width="80" height="20" strokeWidth="2" />
              <rect x="10" y="50" width="80" height="20" strokeWidth="2" />
              <line x1="36" y1="10" x2="36" y2="70" strokeWidth="2" />
              <line x1="63" y1="10" x2="63" y2="70" strokeWidth="2" />
              <text
                x="18"
                y="24"
                fill="currentColor"
                className="text-[10px] font-mono"
              >
                [0]
              </text>
              <text
                x="44"
                y="24"
                fill="currentColor"
                className="text-[10px] font-mono"
              >
                top
              </text>
              <text
                x="18"
                y="44"
                fill="currentColor"
                className="text-[10px] font-mono"
              >
                [1]
              </text>
            </svg>
            <CardHeader className="flex flex-col items-center text-center pb-6 border-b border-border/30">
              <Avatar className="h-20 w-20 border border-primary/20 bg-primary/5 p-1 ring-2 ring-primary/10 mb-4">
                {userInfo.avatar ? (
                  <AvatarImage
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="object-cover rounded-full"
                  />
                ) : null}
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {userInfo.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold text-foreground">
                {userInfo.name}
              </h2>
              <span className="mt-1 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                {getRoleLabel(userInfo.role)}
              </span>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-xs">
                  <UserIcon className="size-4.5 text-muted-foreground shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">ইউজারনেম</p>
                    <p className="font-semibold text-foreground font-mono">
                      {userInfo.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <MailIcon className="size-4.5 text-muted-foreground shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">ইমেইল অ্যাড্রেস</p>
                    <p className="font-semibold text-foreground font-mono">
                      {userInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <ShieldIcon className="size-4.5 text-muted-foreground shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground">
                      প্ল্যাটফর্ম অ্যাক্সেস
                    </p>
                    <p className="font-semibold text-foreground font-mono">
                      রোল: {userInfo.role}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: details code display block & stats (Span 2) */}
        <div className="md:col-span-2 space-y-6">
          {/* Metadata system YAML view */}
          <Card className="border border-border/40 bg-card/60 relative overflow-hidden transition-all hover:border-primary/10">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2 font-mono">
                <Terminal className="size-4 text-primary" />
                user_metadata.yaml
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto bg-black/10 dark:bg-black/35 rounded-b-xl">
              <pre className="text-emerald-500/90 dark:text-emerald-400/95 space-y-1">
                <div>
                  <span className="text-primary">account:</span>
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">uuid:</span>{" "}
                  &quot;
                  {userInfo.documentId}&quot;
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">id:</span>{" "}
                  {userInfo.id}
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">
                    display_name:
                  </span>{" "}
                  &quot;{userInfo.name}&quot;
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">
                    email_address:
                  </span>{" "}
                  &quot;{userInfo.email}&quot;
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">
                    role_type:
                  </span>{" "}
                  &quot;{userInfo.role}&quot;
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">
                    auth_status:
                  </span>{" "}
                  &quot;verified&quot;
                </div>
                <div>
                  {" "}
                  <span className="text-primary-foreground/70">
                    ui_theme:
                  </span>{" "}
                  &quot;system_sync&quot;
                </div>
              </pre>
            </CardContent>
          </Card>

          {/* Dynamic performance summary cards */}
          {userInfo.role === "Student" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border border-border/30 bg-card/50 p-5 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    solved_course.h
                  </span>
                  <BookOpen className="size-4 text-primary" />
                </div>
                <div className="pt-4">
                  <h4 className="text-2xl font-bold font-mono text-foreground">
                    {enrolledCoursesCount}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    টি টপিক চালু আছে
                  </p>
                </div>
              </Card>

              <Card className="border border-border/30 bg-card/50 p-5 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    completed_nodes.log
                  </span>
                  <Activity className="size-4 text-primary" />
                </div>
                <div className="pt-4">
                  <h4 className="text-2xl font-bold font-mono text-foreground">
                    {completedLessonsCount}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    টি লেসন খতম করেছ
                  </p>
                </div>
              </Card>

              <Card className="border border-border/30 bg-card/50 p-5 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    accepted_points.json
                  </span>
                  <Award className="size-4 text-primary" />
                </div>
                <div className="pt-4">
                  <h4 className="text-2xl font-bold font-mono text-foreground">
                    {passedQuizzesCount}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    কুইজে সবুজ বাতি (AC)
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            /* Layout cards for other roles (extensible/reusable layout fallback) */
            <Card className="border border-border/40 bg-card/30 p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Settings className="size-10 text-primary/40 animate-spin-slow" />
              <p className="font-semibold text-sm">
                অন্যান্য অ্যাডমিনিস্ট্রেটিভ ও টিচিং ফিচারসমূহ নির্মাণাধীন রয়েছে।
              </p>
              <span className="text-[10px] font-mono text-muted-foreground/60">
                role_scope: {userInfo.role} status = locked
              </span>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
