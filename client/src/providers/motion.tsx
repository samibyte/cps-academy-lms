"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: "easeOut" }}>
      {children}
    </MotionConfig>
  );
}