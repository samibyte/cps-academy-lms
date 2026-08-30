"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type TermTone = "ac" | "wa" | "tle" | "muted";

const TERMS: {
  label: string;
  tone: TermTone;
  style: React.CSSProperties;
  duration: number;
  delay: number;
}[] = [
  {
    label: "AC",
    tone: "ac",
    style: { top: "12%", left: "6%" },
    duration: 10,
    delay: 0.4,
  },
  {
    label: "TLE",
    tone: "tle",
    style: { top: "22%", right: "7%" },
    duration: 11,
    delay: 1.1,
  },
  {
    label: "WA",
    tone: "wa",
    style: { bottom: "18%", left: "7%" },
    duration: 12,
    delay: 2.2,
  },
  {
    label: "binary_search",
    tone: "muted",
    style: { top: "64%", left: "11%" },
    duration: 13,
    delay: 0.8,
  },
  {
    label: "dp[i][j]",
    tone: "muted",
    style: { top: "42%", right: "13%" },
    duration: 15,
    delay: 3.1,
  },
  {
    label: "O(n log n)",
    tone: "muted",
    style: { bottom: "14%", right: "12%" },
    duration: 12,
    delay: 1.6,
  },
  {
    label: "DFS",
    tone: "muted",
    style: { top: "10%", left: "30%" },
    duration: 11,
    delay: 2.8,
  },
  {
    label: "seg_tree",
    tone: "muted",
    style: { bottom: "8%", left: "36%" },
    duration: 14,
    delay: 3.6,
  },
];

const TONES: Record<TermTone, string> = {
  ac: "text-cp-ac",
  wa: "text-cp-wa",
  tle: "text-cp-tle",
  muted: "text-muted-foreground",
};

const OPACITY: Record<TermTone, number> = {
  ac: 0.16,
  wa: 0.14,
  tle: 0.14,
  muted: 0.09,
};

export function FloatingTerms() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {TERMS.map((term) => (
        <motion.span
          key={term.label}
          className={cn(
            "absolute font-mono text-[11px] tracking-wide sm:text-sm",
            TONES[term.tone],
          )}
          style={{ ...term.style, opacity: OPACITY[term.tone] }}
          animate={{ y: [0, -14, 0], x: [0, 6, 0] }}
          transition={{
            duration: term.duration,
            delay: term.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {term.label}
        </motion.span>
      ))}
    </div>
  );
}