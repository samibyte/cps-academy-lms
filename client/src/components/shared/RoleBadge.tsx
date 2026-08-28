import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type UserRole = "Admin" | "Content Manager" | "Instructor" | "Student" | string

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalizedRole = role.trim().toLowerCase()

  let badgeStyles = ""
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline"
  let roleLabel = role

  switch (normalizedRole) {
    case "admin":
      roleLabel = "Admin"
      badgeVariant = "destructive"
      badgeStyles = "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/25"
      break
    case "content manager":
    case "content_manager":
      roleLabel = "Content Manager"
      badgeVariant = "outline"
      badgeStyles = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/25"
      break
    case "instructor":
      roleLabel = "Instructor"
      badgeVariant = "default"
      badgeStyles = "bg-emerald-500 hidden! text-emerald-foreground hover:bg-emerald-500/80" // Note: we can use a custom theme or inline classes
      // Wait, let's use custom emerald theme for premium look:
      badgeStyles = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
      break
    case "student":
      roleLabel = "Student"
      badgeVariant = "secondary"
      badgeStyles = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/25"
      break
    default:
      badgeVariant = "outline"
      badgeStyles = "bg-muted text-muted-foreground border-border hover:bg-muted/80"
  }

  return (
    <Badge
      variant={badgeVariant}
      className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold select-none cursor-default", badgeStyles, className)}
    >
      {roleLabel}
    </Badge>
  )
}
