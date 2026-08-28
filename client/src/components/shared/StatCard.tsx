import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>
  trend?: {
    value: string | number
    isPositive?: boolean
    label?: string
  }
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  // Check if Icon is a component or a raw React node
  const renderIcon = () => {
    if (!Icon) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof Icon === "function" || (typeof Icon === "object" && Icon !== null && "render" in (Icon as any))) {
      const IconComponent = Icon as React.ComponentType<{ className?: string }>
      return <IconComponent className="size-4 text-muted-foreground" />
    }
    return <div className="text-muted-foreground">{Icon as React.ReactNode}</div>
  }

  return (
    <Card className={cn("transition-all hover:shadow-xs", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {renderIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {trend && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <span
              className={cn(
                "font-medium",
                trend.isPositive === true && "text-emerald-600 dark:text-emerald-400",
                trend.isPositive === false && "text-rose-600 dark:text-rose-400",
                trend.isPositive === undefined && "text-muted-foreground"
              )}
            >
              {trend.isPositive === true ? "+" : ""}
              {trend.value}
            </span>
            {trend.label && <span>{trend.label}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
