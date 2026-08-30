import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal } from "./motion/Reveal";
import { Section } from "./Section";

export function CtaBanner() {
  return (
    <Section>
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-6 py-14 text-center sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 h-40 w-full max-w-md -translate-x-1/2 rounded-full bg-primary/10 blur-[90px]"
          />

          <p className="relative mb-4 text-[11px] font-mono uppercase tracking-widest text-primary/80">
            {"// ready_to_compile"}
          </p>

        <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
          শেখা শুরু করতে প্রস্তুত?
        </h2>

        <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          একাউন্ট বানিয়ে আজই তোমার প্রথম কোর্সে এনরোল করো — রেটিং ওঠানোর
          কাউন্টডাউন শুরু হোক এখনই।
        </p>

        <div className="relative mt-8">
          <Button
            size="lg"
            className="font-semibold"
            nativeButton={false}
            render={
              <Link href="/auth/register">
                সাইন আপ করো
                <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>
        </div>
      </Reveal>
    </Section>
  );
}