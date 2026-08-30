"use client";

import { motion, useScroll, useTransform } from "framer-motion";

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
  ac: 0.72,
  wa: 0.68,
  tle: 0.68,
  muted: 0.42,
};

export function FloatingTerms() {
  const { scrollYProgress } = useScroll();
  const groupY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.35, 1],
    [0, -60, -180, -260],
  );
  const groupOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.22, 0.5, 1],
    [1, 0.96, 0.7, 0.2, 0],
  );

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none z-40 absolute inset-0 overflow-hidden select-none"
      style={{ y: groupY, opacity: groupOpacity }}
    >
      {TERMS.map((term) => (
        <motion.span
          key={term.label}
          className={cn(
            "absolute font-mono text-[11px] tracking-wide sm:text-sm",
            TONES[term.tone],
          )}
          style={{
            ...term.style,
            opacity: OPACITY[term.tone],
            filter: "drop-shadow(0 0 12px rgba(148, 163, 184, 0.28))",
          }}
          animate={{ y: [0, -8, 0, 4, 0], x: [0, 3, 0, -2, 0] }}
          transition={{
            duration: term.duration,
            delay: term.delay,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
          }}
        >
          {term.label}
        </motion.span>
      ))}
    </motion.div>
  );
}
