"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FloatingTerms } from "./motion/FloatingTerms";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-grid-cyber">
      <FloatingTerms />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]"
      />

      <motion.div
        className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p
          variants={item}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground backdrop-blur"
        >
          <span className="size-1.5 rounded-full bg-cp-ac" aria-hidden />
          competitive_programming_school
        </motion.p>

        <motion.h1
          variants={item}
          className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          প্রোগ্রামিং শিখো, <span className="text-primary">যুদ্ধ জিতো</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          বাংলায় competitive programming-এর গোছানো কোর্স, নিয়মিত কুইজ আর
          নিজের অগ্রগতির রিপোর্টকার্ড — সব এক জায়গায়।
        </motion.p>

        <motion.div
          variants={item}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            size="lg"
            nativeButton={false}
            render={
              <Link href="/auth/register">
                সাইন আপ করো
                <ArrowRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/courses">কোর্স দেখো</Link>}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}