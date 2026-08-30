"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ChevronLeftIcon,
  AwardIcon,
  Clock,
  Target,
  Repeat2,
  Terminal,
  AlertTriangle,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Quiz, QuizAttempt } from "@/app/dashboard/student/_lib/types";
import { submitQuizAttemptAction } from "@/app/dashboard/student/_lib/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuizFormProps {
  courseId: string;
  quiz: Quiz & { documentId: string };
  studentDocId: string;
  attempts: QuizAttempt[];
}

/** Format seconds as MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** sessionStorage key for start timestamp, unique per quiz */
function sessionKey(quizDocId: string) {
  return `quiz_started_at_${quizDocId}`;
}

/**
 * Deriving the access rule:
 *   • If the student has EVER passed → unlimited retakes (not blocked).
 *   • If the student has NOT passed AND used all maxAttempts → blocked.
 *   • Otherwise → can attempt.
 *
 * `maxAttempts` is the trial window (default 3). Passing unlocks unlimited
 * future retakes; failing all attempts in the window blocks further access.
 */
function deriveAttemptState(
  attempts: QuizAttempt[],
  maxAttempts: number,
): { hasPassedOnce: boolean; isBlocked: boolean; trialsUsed: number } {
  const hasPassedOnce = attempts.some((a) => a.passed);
  // Once passed, student is NEVER blocked regardless of attempt count.
  const isBlocked = !hasPassedOnce && attempts.length >= maxAttempts;
  return { hasPassedOnce, isBlocked, trialsUsed: attempts.length };
}

export default function QuizForm({
  courseId,
  quiz,
  studentDocId,
  attempts,
}: QuizFormProps) {
  const router = useRouter();

  /* ── Quiz metadata ────────────────────────────────────────────────────────*/
  const timeLimitSeconds = quiz.timeLimit;
  const maxAttempts = quiz.maxAttempts;
  const { hasPassedOnce, isBlocked, trialsUsed } = deriveAttemptState(
    attempts,
    maxAttempts,
  );
  // Trials remaining is only meaningful BEFORE the student has passed.
  const trialsLeft = hasPassedOnce
    ? Infinity
    : Math.max(0, maxAttempts - trialsUsed);
  const sortedQuestions = [...(quiz.questions ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  /* Form state */
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [isPending, setIsPending] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [result, setResult] = React.useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    message: string;
    gradedQuestions?: Array<{
      id: number;
      question: string;
      chosenOption: string;
      isCorrect: boolean;
    }>;
  } | null>(null);

  /*  Timer state
   * Start timestamp is persisted in sessionStorage so a page refresh cannot
   * reset the clock.  We use refs for the auto-submit effect to avoid stale
   * closures without disabling the exhaustive-deps lint rule.
   */
  const [startedAt, setStartedAt] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";

    const key = sessionKey(quiz.documentId);
    const stored = sessionStorage.getItem(key);
    const startIso = stored ?? new Date().toISOString();
    if (!stored) sessionStorage.setItem(key, startIso);

    return startIso;
  });
  const [secondsLeft, setSecondsLeft] = React.useState<number>(() => {
    if (!startedAt) return timeLimitSeconds;

    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000,
    );
    return Math.max(0, timeLimitSeconds - elapsed);
  });
  const submitCalledRef = React.useRef(false);

  // Keep refs in sync so the auto-submit effect always sees fresh values
  const answersRef = React.useRef(answers);
  React.useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const startedAtRef = React.useRef(startedAt);
  React.useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  // Countdown tick
  React.useEffect(() => {
    if (isBlocked || result || !startedAt || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlocked, startedAt, result, secondsLeft]);

  const timerExpired = secondsLeft <= 0;

  React.useEffect(() => {
    if (
      !timerExpired ||
      result ||
      submitCalledRef.current ||
      !startedAtRef.current
    )
      return;
    submitCalledRef.current = true;
    doSubmit(answersRef.current, startedAtRef.current);
  }, [doSubmit, result, timerExpired]);

  /* ── Handlers */
  const handleOptionChange = (questionId: number, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const isFormValid =
    sortedQuestions.length > 0 &&
    sortedQuestions.every((q) => answers[q.id] !== undefined);

  async function doSubmit(
    currentAnswers: Record<number, string>,
    quizStartedAt: string,
  ) {
    setIsPending(true);
    try {
      const res = await submitQuizAttemptAction({
        quizDocId: quiz.documentId,
        courseDocId: courseId,
        studentDocId,
        answers: currentAnswers,
        startedAt: quizStartedAt,
      });

      if (res.success && res.score !== undefined) {
        sessionStorage.removeItem(sessionKey(quiz.documentId));
        setResult({
          score: res.score,
          totalPoints: res.totalPoints ?? 0,
          percentage: res.percentage ?? 0,
          passed: res.passed ?? false,
          gradedQuestions: res.gradedQuestions ?? [],
          message: res.message,
        });
        setIsModalOpen(true);
        router.refresh();

        if (res.passed) {
          toast.success("অভিনন্দন! কুইজ পাস!", {
            description: `স্কোর: ${res.score}/${res.totalPoints} (${res.percentage}%)`,
          });
        } else {
          toast.error("পাস হয়নি", {
            description: res.message,
          });
        }
      } else {
        toast.error("কুইজ জমা দেওয়া ব্যর্থ হয়েছে", {
          description: res.message || "অনুগ্রহ করে পুনরায় চেষ্টা করো।",
        });
      }
    } catch {
      toast.error("অপ্রত্যাশিত ত্রুটি", {
        description: "Quiz submission failed unexpectedly. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isPending || !startedAt) return;
    doSubmit(answers, startedAt);
  };

  /*Derived display values */
  const isTimerRed = secondsLeft <= 60 && !result;
  const timerDisplay = formatTime(secondsLeft);
  const timerPct =
    timeLimitSeconds > 0 ? (secondsLeft / timeLimitSeconds) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Questions panel */}
      <div className="lg:col-span-2 space-y-5">
        {result ? (
          /* Result card */
          <Card
            className={`border ${result.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"}`}
          >
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold font-mono ${
                  result.passed
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                {result.passed ? "AC" : "WA"}
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  {result.passed
                    ? "সবুজ বাতি পেয়েছ (AC)!"
                    : "লাল বাতি (WA) — আবার চেষ্টা করো"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {result.message}
                </p>
              </div>

              {/* Score summary */}
              <div className="grid grid-cols-3 gap-6 w-full border-y border-border/30 py-6">
                <div className="space-y-1 text-center">
                  <span className="block text-3xl font-bold font-mono">
                    {result.score}/{result.totalPoints}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    প্রাপ্ত নম্বর
                  </span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="block text-3xl font-bold font-mono">
                    {result.percentage}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    শতকরা হার
                  </span>
                </div>
                <div className="space-y-1 text-center">
                  <span
                    className={`block text-3xl font-bold font-mono ${result.passed ? "text-emerald-500" : "text-destructive"}`}
                  >
                    {result.passed ? "পাস" : "ফেইল"}
                  </span>
                  <span className="text-xs text-muted-foreground">ফলাফল</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  nativeButton={false}
                  size="sm"
                  variant="outline"
                  render={
                    <Link href={`/dashboard/student/courses/${courseId}`}>
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                      কোর্সে ফিরে যাও
                    </Link>
                  }
                />
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  বিস্তারিত ইভ্যালুয়েশন দেখো
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isBlocked ? (
          <Alert variant="destructive" className="rounded-xl">
            <XCircleIcon className="h-4 w-4" />
            <AlertTitle>প্রচেষ্টার সীমা শেষ</AlertTitle>
            <AlertDescription>
              তুমি সর্বোচ্চ {maxAttempts}টি প্রচেষ্টা ব্যবহার করে ফেলেছ এবং পাস
              করতে পারোনি। মেন্টরের সাথে যোগাযোগ করো।
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Timer warning */}
            {isTimerRed && !timerExpired && (
              <Alert className="border-destructive/40 bg-destructive/5 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive font-mono">
                  সময় শেষ হচ্ছে!
                </AlertTitle>
                <AlertDescription className="text-destructive/80">
                  মাত্র <strong>{timerDisplay}</strong> বাকি আছে। দ্রুত জমা দাও!
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {sortedQuestions.map((q, idx) => (
                <Card
                  key={q.id}
                  className={`border transition-all duration-200 ${
                    answers[q.id] !== undefined
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/30 bg-card/60"
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-sm text-foreground leading-snug">
                          {q.question}
                        </h3>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {q.points} পয়েন্ট
                        </span>
                      </div>
                    </div>

                    <RadioGroup
                      value={answers[q.id] || ""}
                      onValueChange={(val) => handleOptionChange(q.id, val)}
                      className="space-y-2 pl-9"
                    >
                      {(q.options ?? []).map((o) => (
                        <label
                          key={o.id}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                            answers[q.id] === o.key
                              ? "border-primary bg-primary/8 dark:bg-primary/10"
                              : "border-border/40 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <RadioGroupItem value={o.key} className="shrink-0" />
                          <span className="text-[10px] font-mono font-bold text-muted-foreground w-4 shrink-0">
                            {o.key}.
                          </span>
                          <span className="text-sm text-foreground">
                            {o.value}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={!isFormValid || isPending}
                  className="gap-2 px-8 font-semibold"
                >
                  {isPending
                    ? "জমা দেওয়া হচ্ছে..."
                    : hasPassedOnce
                      ? "পুনরায় কুইজ দাও (Redo Quiz)"
                      : "কুইজ জমা দাও"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Quiz metadata + timer */}
        <Card className="border border-border/40 bg-card/60 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 text-[9px] font-mono opacity-15 text-primary">
            quiz_meta.json
          </div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <AwardIcon className="size-3.5 text-primary" />
              কুইজ তথ্য.json
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs font-mono">
            {/* Live countdown */}
            {!result && !isBlocked && (
              <div
                className={`flex flex-col items-center justify-center rounded-xl border py-4 mb-2 transition-colors ${
                  isTimerRed
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${
                    isTimerRed ? "text-destructive/70" : "text-muted-foreground"
                  }`}
                >
                  সময় বাকি
                </span>
                <span
                  className={`text-3xl font-bold font-mono tabular-nums transition-colors ${
                    isTimerRed ? "text-destructive" : "text-foreground"
                  } ${timerExpired ? "animate-pulse" : ""}`}
                >
                  {timerExpired ? "00:00" : timerDisplay}
                </span>
                {/* Progress bar */}
                <div className="mt-2 w-full px-3">
                  <div className="h-1 rounded-full bg-border/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isTimerRed ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${timerPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="size-3.5" /> পাসিং স্কোর
              </span>
              <span className="font-semibold text-foreground">
                {quiz.passingScore}%
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> সময়সীমা
              </span>
              <span className="font-semibold text-foreground">
                {Math.floor(timeLimitSeconds / 60)} মিনিট
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Terminal className="size-3.5" /> মোট প্রশ্ন
              </span>
              <span className="font-semibold text-foreground">
                {sortedQuestions.length}টি
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Repeat2 className="size-3.5" /> অবশিষ্ট সুযোগ
              </span>
              {hasPassedOnce ? (
                // Passed at least once → unlimited retakes
                <span className="flex items-center gap-1 font-semibold text-emerald-500">
                  <InfinityIcon className="size-3.5" />
                  সীমাহীন
                </span>
              ) : (
                <span
                  className={`font-semibold ${trialsLeft === 0 ? "text-destructive" : "text-amber-500"}`}
                >
                  {trialsLeft}/{maxAttempts}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previous attempts log */}
        <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">
              পূর্ববর্তী প্রচেষ্টা.log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                এখনো কোনো প্রচেষ্টা নেই।
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {attempts.map((attempt, idx) => (
                  <div
                    key={attempt.id}
                    className={`rounded-lg p-3 text-xs border ${
                      attempt.passed
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-destructive/15 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-semibold">
                        #{attempts.length - idx}
                      </span>
                      <Badge
                        className={`text-[9px] font-mono border ${
                          attempt.passed
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {attempt.passed ? "AC" : "WA"}
                      </Badge>
                    </div>
                    <div className="font-mono text-muted-foreground space-y-0.5">
                      <div>
                        স্কোর: {attempt.score}/{attempt.totalPoints} (
                        {attempt.percentage}%)
                      </div>
                      <div>
                        সময়: {Math.floor((attempt.timeTaken ?? 0) / 60)}m{" "}
                        {(attempt.timeTaken ?? 0) % 60}s
                      </div>
                      <div>
                        তারিখ:{" "}
                        {new Date(attempt.submittedAt).toLocaleDateString(
                          "bn-BD",
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Result evaluation modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-card/95 border border-border/40 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <AwardIcon className="size-5 text-primary" />
              কুইজের ফলাফল ইভ্যালুয়েশন
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground">
              {result && (
                <>
                  প্রাপ্ত নম্বর: {result.score}/{result.totalPoints} (
                  {result.percentage}%) |{" "}
                  {result.passed ? (
                    <span className="text-emerald-500 font-bold">পাস (AC)</span>
                  ) : (
                    <span className="text-destructive font-bold">
                      ফেইল (WA)
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {result?.gradedQuestions?.map((gq, idx) => {
              const originalQ = quiz.questions?.find((q) => q.id === gq.id);
              const chosenOptionValue = originalQ?.options?.find(
                (opt) => opt.key === gq.chosenOption,
              )?.value;

              return (
                <div
                  key={gq.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    gq.isCorrect
                      ? "border-emerald-500/20 bg-emerald-500/5 text-foreground"
                      : "border-destructive/20 bg-destructive/5 text-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold leading-relaxed">
                      {idx + 1}. {gq.question}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 border ${
                        gq.isCorrect
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}
                    >
                      {gq.isCorrect ? "সঠিক" : "ভুল"}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    তোমার পছন্দ:{" "}
                    <span className="font-bold text-foreground">
                      {gq.chosenOption || "উত্তর দেওয়া হয়নি"}
                    </span>
                    {chosenOptionValue && ` - ${chosenOptionValue}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2 border-t border-border/20">
            <Button onClick={() => setIsModalOpen(false)}>বন্ধ করো</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
