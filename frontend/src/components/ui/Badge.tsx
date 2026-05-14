import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-heading font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-orange/10 text-brand-orange border border-brand-orange/20",
        secondary: "bg-brand-lightgray text-brand-mid",
        outline: "border border-brand-lightgray text-brand-mid",
        success: "bg-brand-green/10 text-brand-green border border-brand-green/20",
        destructive: "bg-red-50 text-red-600 border border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
