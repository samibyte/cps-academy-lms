import { cn } from "@/lib/utils";

import { getPublicStats } from "./_lib/stats";
import { CountUp } from "./motion/CountUp";
import { Reveal } from "./motion/Reveal";
import { Section } from "./Section";

const STATS_ENTRIES = [
  {
    code: "COU-01",
    hint: "courses.cpp",
    label: "মোট কোর্স",
    key: "totalCourses",
    color: "text-cp-tle",
  },
  {
    code: "STU-02",
    hint: "students.io",
    label: "মোট শিক্ষার্থী",
    key: "totalStudents",
    color: "text-cp-ac",
  },
  {
    code: "LSN-03",
    hint: "lessons.ts",
    label: "মোট লেসন",
    key: "totalLessons",
    color: "text-cp-re",
  },
] as const;

export async function StatsBar() {
  const stats = await getPublicStats();

  return (
    <Section className="py-12 sm:py-16">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              std // standings
            </span>
            {stats ? (
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-cp-ac">
                <span className="size-1.5 rounded-full bg-cp-ac" aria-hidden />
                verdict_log: ok
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-cp-wa">
                <span className="size-1.5 rounded-full bg-cp-wa" aria-hidden />
                verdict_log: n/a
              </span>
            )}
          </div>

          <div className="grid divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS_ENTRIES.map((entry, index) => (
              <Reveal key={entry.code} delay={index * 0.08}>
                <div className="flex flex-col gap-1.5 px-6 py-6 sm:py-7">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                      {entry.code}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      {entry.hint}
                    </span>
                  </div>
                  <CountUp
                    value={stats?.[entry.key]}
                    pad={4}
                    className={cn(
                      "font-mono text-4xl font-bold tracking-tight tabular-nums",
                      entry.color,
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {entry.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}