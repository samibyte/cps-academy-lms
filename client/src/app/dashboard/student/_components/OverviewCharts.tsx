"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { AlertCircle } from "lucide-react"

interface ChartProps {
  progresses: any[]
  attempts: any[]
}

export function OverviewCharts({ progresses, attempts }: ChartProps) {
  const daysOfWeek = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"]
  const now = new Date()

  // Build last 7 days activity from real lesson progress & quiz attempt data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(now.getDate() - (6 - i))
    const dateStr = date.toDateString()
    const label = daysOfWeek[date.getDay()]

    const lessonSolves = progresses.filter((p) => {
      if (!p.completed || !p.updatedAt) return false
      return new Date(p.updatedAt).toDateString() === dateStr
    }).length

    const quizAttempts = attempts.filter((a) => {
      if (!a.submittedAt) return false
      return new Date(a.submittedAt).toDateString() === dateStr
    }).length

    return { day: label, lessons: lessonSolves, quizzes: quizAttempts }
  })

  const hasAnyActivity = chartData.some((d) => d.lessons > 0 || d.quizzes > 0)

  const chartConfig = {
    lessons: {
      label: "লেসন খতম",
      color: "var(--color-primary)",
    },
    quizzes: {
      label: "কুইজ প্রচেষ্টা",
      color: "var(--color-cp-ac)",
    },
  }

  return (
    <Card className="border border-border/40 bg-card/40 backdrop-blur-xl relative overflow-hidden transition-all hover:border-primary/20">
      <div className="absolute top-3 right-4 select-none pointer-events-none text-xs font-mono opacity-20 text-primary">
        submission_log.cpp
      </div>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold">সাপ্তাহিক অ্যাক্টিভিটি.json</CardTitle>
        <CardDescription>
          {hasAnyActivity
            ? "গত ৭ দিনে তুমি কতটি লেসন শেষ করেছ এবং কুইজ দিয়েছ"
            : "গত ৭ দিনে কোনো অ্যাক্টিভিটি নেই — আজই শুরু করো!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        {!hasAnyActivity ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50">
            <AlertCircle className="size-8" />
            <p className="text-xs font-mono">// no activity recorded yet</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ left: 16, right: 16, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cp-ac)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-cp-ac)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} className="font-mono text-xs" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} className="font-mono text-xs" />
              <Tooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="lessons" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorLessons)" strokeWidth={2} />
              <Area type="monotone" dataKey="quizzes" stroke="var(--color-cp-ac)" fillOpacity={1} fill="url(#colorQuizzes)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
