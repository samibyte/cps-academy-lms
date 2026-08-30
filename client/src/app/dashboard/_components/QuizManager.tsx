"use client";

import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/shared/FormDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Plus, Edit } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/app/dashboard/_lib/types";
import {
  createQuizAction,
  updateQuizAction,
} from "@/app/dashboard/_lib/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const quizMetaSchema = z.object({
  title: z.string().min(2),
  passingScore: z.coerce.number().min(1),
  timeLimit: z.coerce.number().min(1),
  maxAttempts: z.coerce.number().min(1).default(3),
});

const quizQuestionSchema = z.object({
  question: z.string().min(3),
  points: z.coerce.number().min(1),
  order: z.coerce.number().min(1),
  correctOption: z.enum(["A", "B", "C", "D"]),
  optA: z.string().min(1),
  optB: z.string().min(1),
  optC: z.string().min(1),
  optD: z.string().min(1),
});

type QuizMetaValues = z.infer<typeof quizMetaSchema>;
type QuizQuestionValues = z.infer<typeof quizQuestionSchema>;

interface QuizManagerProps {
  courseId: string;
  courseTitle: string;
  quiz: Quiz | null;
  token?: string;
}

/** Flatten question → form values */
function questionToForm(q: QuizQuestion): QuizQuestionValues {
  return {
    question: q.question,
    points: q.points,
    order: q.order,
    correctOption: q.correctOption,
    optA: q.options.find((o) => o.key === "A")?.value ?? "",
    optB: q.options.find((o) => o.key === "B")?.value ?? "",
    optC: q.options.find((o) => o.key === "C")?.value ?? "",
    optD: q.options.find((o) => o.key === "D")?.value ?? "",
  };
}

/** Expand form values → Strapi question component shape */
function formToQuestion(vals: QuizQuestionValues, existingId?: number) {
  const base = {
    question: vals.question,
    points: vals.points,
    order: vals.order,
    correctOption: vals.correctOption,
    options: [
      { key: "A", value: vals.optA },
      { key: "B", value: vals.optB },
      { key: "C", value: vals.optC },
      { key: "D", value: vals.optD },
    ],
  };
  return existingId ? { ...base, id: existingId } : base;
}

export function QuizManager({
  courseId,
  courseTitle,
  quiz,
  token,
}: QuizManagerProps) {
  void token;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleUpdateMeta = async (values: QuizMetaValues) => {
    if (quiz) {
      await updateQuizAction(quiz.documentId, values);
    } else {
      await createQuizAction({ ...values, course: courseId, questions: [] });
    }
    startTransition(() => router.refresh());
  };

  const handleAddQuestion = async (vals: QuizQuestionValues) => {
    if (!quiz) return;
    const updatedQuestions = [
      ...quiz.questions.map((q) => ({ ...q })),
      formToQuestion(vals),
    ];
    await updateQuizAction(quiz.documentId, { questions: updatedQuestions });
    startTransition(() => router.refresh());
  };

  const handleUpdateQuestion = async (
    index: number,
    vals: QuizQuestionValues,
  ) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.map((q, i) =>
      i === index ? formToQuestion(vals, q.id) : { ...q },
    );
    await updateQuizAction(quiz.documentId, { questions: updatedQuestions });
    startTransition(() => router.refresh());
  };

  const QuestionForm = ({
    form,
  }: {
    form: UseFormReturn<QuizQuestionValues>;
  }) => (
    <div className="grid gap-4 py-2">
      <div className="grid gap-1.5">
        <label className="text-sm font-medium">প্রশ্ন</label>
        <Input {...form.register("question")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">ক্রম</label>
          <Input type="number" {...form.register("order")} />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">পয়েন্ট</label>
          <Input type="number" {...form.register("points")} />
        </div>
      </div>
      <div className="space-y-2 pt-2 border-t border-border/40">
        <p className="text-sm font-semibold">Options</p>
        {(["A", "B", "C", "D"] as const).map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-6 font-mono text-xs font-bold">{key}</span>
            <Input className="h-8 text-sm" {...form.register(`opt${key}`)} />
          </div>
        ))}
      </div>
      <div className="grid gap-1.5 pt-2">
        <label className="text-sm font-medium">সঠিক উত্তর</label>
        <Select
          onValueChange={(value) => {
            const option = value as "A" | "B" | "C" | "D" | null;
            if (option) {
              form.setValue("correctOption", option);
            }
          }}
          defaultValue={form.getValues("correctOption")}
        >
          <SelectTrigger>
            <SelectValue placeholder="সিলেক্ট করুন" />
          </SelectTrigger>
          <SelectContent>
            {["A", "B", "C", "D"].map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card/20 rounded-xl border border-dashed border-border/80 gap-3">
        <div className="text-muted-foreground p-3 rounded-full bg-muted/40">
          <Edit className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">কোনো কুইজ নেই</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            এই কোর্সের জন্য কুইজ যুক্ত হয়নি।
          </p>
        </div>
        <FormDialog
          title="নতুন কুইজ"
          trigger={<Button className="mt-2">কুইজ তৈরি করুন</Button>}
          schema={quizMetaSchema}
          defaultValues={{
            title: `${courseTitle} Quiz`,
            passingScore: 60,
            timeLimit: 30,
            maxAttempts: 3,
          }}
          onSubmit={handleUpdateMeta}
        >
          {(form: UseFormReturn<QuizMetaValues>) => (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">টাইটেল</label>
                <Input {...form.register("title")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">পাস নম্বর (%)</label>
                  <Input type="number" {...form.register("passingScore")} />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">সময় (মিনিট)</label>
                  <Input type="number" {...form.register("timeLimit")} />
                </div>
              </div>
            </div>
          )}
        </FormDialog>
      </div>
    );
  }

  const columns: ColumnDef<QuizQuestion>[] = [
    {
      accessorKey: "order",
      header: "Q#",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">
          Q{row.getValue("order")}
        </span>
      ),
    },
    {
      accessorKey: "question",
      header: "প্রশ্ন",
      cell: ({ row }) => (
        <span className="font-medium truncate max-w-sm block">
          {row.getValue("question")}
        </span>
      ),
    },
    {
      accessorKey: "points",
      header: "পয়েন্ট",
      cell: ({ row }) => (
        <span className="font-mono">{row.getValue("points")}</span>
      ),
    },
    {
      accessorKey: "correctOption",
      header: "Answer",
      cell: ({ row }) => (
        <Badge className="font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
          {row.getValue("correctOption")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const q: QuizQuestion = row.original;
        return (
          <div className="flex justify-end">
            <FormDialog
              title="প্রশ্ন এডিট করুন"
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Edit className="size-3" /> Edit
                </Button>
              }
              schema={quizQuestionSchema}
              defaultValues={questionToForm(q)}
              onSubmit={(vals) => handleUpdateQuestion(row.index, vals)}
            >
              {(form) => <QuestionForm form={form} />}
            </FormDialog>
          </div>
        );
      },
    },
  ];

  const nextOrder =
    quiz.questions.length > 0
      ? Math.max(...quiz.questions.map((q) => q.order)) + 1
      : 1;

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              পাস: {quiz.passingScore}% · সময়: {quiz.timeLimit / 60} মিনিট ·
              অ্যাটেম্পট: {quiz.maxAttempts}
            </p>
          </div>
          <FormDialog
            title="কুইজ সেটিংস"
            trigger={
              <Button variant="outline" size="sm">
                <Edit className="size-4 mr-2" />
                সেটিংস
              </Button>
            }
            schema={quizMetaSchema}
            defaultValues={{
              title: quiz.title,
              passingScore: quiz.passingScore,
              timeLimit: quiz.timeLimit,
              maxAttempts: quiz.maxAttempts,
            }}
            onSubmit={handleUpdateMeta}
          >
            {(form: UseFormReturn<QuizMetaValues>) => (
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">টাইটেল</label>
                  <Input {...form.register("title")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">পাস নম্বর (%)</label>
                    <Input type="number" {...form.register("passingScore")} />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">সময় (মিনিট)</label>
                    <Input type="number" {...form.register("timeLimit")} />
                  </div>
                </div>
              </div>
            )}
          </FormDialog>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">কুইজের প্রশ্নসমূহ</h2>
        <FormDialog
          title="নতুন প্রশ্ন"
          trigger={
            <Button size="sm">
              <Plus className="size-4 mr-1" /> প্রশ্ন যোগ করুন
            </Button>
          }
          schema={quizQuestionSchema}
          defaultValues={{
            question: "",
            points: 1,
            order: nextOrder,
            correctOption: "A",
            optA: "",
            optB: "",
            optC: "",
            optD: "",
          }}
          onSubmit={handleAddQuestion}
        >
          {(form) => <QuestionForm form={form} />}
        </FormDialog>
      </div>

      <DataTable
        columns={columns}
        data={quiz.questions}
        searchKey="question"
        searchPlaceholder="প্রশ্ন খুঁজুন..."
      />
    </div>
  );
}
