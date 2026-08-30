"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number | undefined;
  className?: string;
  pad?: number;
}

export function CountUp({ value, className, pad = 0 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 900, bounce: 0 });
  const display = useTransform(spring, (latest) => {
    const rounded = Math.round(latest);
    return pad > 0 ? String(rounded).padStart(pad, "0") : String(rounded);
  });

  useEffect(() => {
    if (inView && value !== undefined) motionValue.set(value);
  }, [inView, motionValue, value]);

  if (value === undefined) {
    return <span className={cn(className)}>{"--"}</span>;
  }

  return (
    <motion.span ref={ref} className={cn(className)}>
      {display}
    </motion.span>
  );
}