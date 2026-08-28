import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max: number
  unit?: string // e.g. "lessons", "quizzes", "tasks"
  className?: string
  showLabel?: boolean
}

export function ProgressBar({
  value,
  max,
  unit = "lessons",
  className,
  showLabel = true,
}: ProgressBarProps) {
  const safeMax = Math.max(0, max)
  const safeValue = Math.min(safeMax, Math.max(0, value))
  const percentage = safeMax > 0 ? Math.round((safeValue / safeMax) * 100) : 0

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>
            {safeValue} of {safeMax} {unit}
          </span>
          <span className="tabular-nums font-semibold text-foreground">
            {percentage}%
          </span>
        </div>
      )}
      <Progress value={percentage} />
    </div>
  )
}
