import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#E3E3E3] text-[#061623] hover:bg-[#D1D1D1]",
        primary:
          "border-transparent bg-[#30714C] text-white hover:bg-[#265d3d]",
        secondary:
          "border-transparent bg-[#DDC66F] text-[#061623] hover:bg-[#d9b857]",
        outline: "border-[#E3E3E3] text-[#061623]",
        // Confidence levels
        "confidence-high":
          "bg-[#F0FDF4] border-[#30714C] text-[#30714C]",
        "confidence-medium":
          "bg-[#FFF3CD] border-[#D6A800] text-[#856404]",
        "confidence-low":
          "bg-[#FFEDED] border-[#C1201C] text-[#C1201C]",
        // Source types
        ai: "bg-[#EFF6FF] border-[#3B82F6] text-[#1E40AF]",
        manual: "bg-[#F3F4F6] border-[#6B7280] text-[#374151]",
        modified: "bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]",
        verified: "bg-[#DCFCE7] border-[#16A34A] text-[#166534]",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  confidence?: number
}

function Badge({ className, variant, size, confidence, children, ...props }: BadgeProps) {
  // Auto-select confidence variant based on confidence score
  let effectiveVariant = variant
  if (confidence !== undefined && !variant) {
    if (confidence >= 90) {
      effectiveVariant = "confidence-high"
    } else if (confidence >= 70) {
      effectiveVariant = "confidence-medium"
    } else {
      effectiveVariant = "confidence-low"
    }
  }

  return (
    <div className={cn(badgeVariants({ variant: effectiveVariant, size }), className)} {...props}>
      {confidence !== undefined ? `${confidence}%` : children}
    </div>
  )
}

export { Badge, badgeVariants }
