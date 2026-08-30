import { Search, UserPlus, TrendingUp } from "lucide-react";

import { Reveal } from "./motion/Reveal";
import { Section, SectionHeader } from "./Section";

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "কোর্স খুঁজুন",
    description:
      "লেভেল আর ট্যাগ দেখে তোমার জন্য পারফেক্ট একটা কোর্স বেছে নাও।",
  },
  {
    number: "02",
    icon: UserPlus,
    title: "এনরোল করুন",
    description:
      "এক ক্লিকে এনরোল করে সাথে সাথে লেসন আর কুইজ এক্সেস করে নাও।",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "অগ্রগতি ট্র্যাক করুন",
    description:
      "প্রতিটি লেসন আর কুইজের রিপোর্টকার্ড দেখে নিজের রেটিং তুলতে থাকো।",
  },
];

export function HowItWorks() {
  return (
    <Section>
      <Reveal>
        <SectionHeader
          eyebrow="// how_it_works"
          title="যেভাবে শুরু হবে তোমার যাত্রা"
          description="তিনটি স্টেপই — সহজ, গোছানো আর পুরোটাই তোমার গতিতে।"
        />
      </Reveal>

      <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
        {STEPS.map(({ number, icon: Icon, title, description }, index) => (
          <Reveal key={number} delay={index * 0.1}>
            <div className="relative flex flex-col items-center text-center">
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute top-6 right-[-14%] hidden w-7 border-t border-dashed border-border sm:block"
                />
              )}

              <div className="relative">
                <div className="flex size-12 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="absolute -right-3 -bottom-2 rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  {number}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}