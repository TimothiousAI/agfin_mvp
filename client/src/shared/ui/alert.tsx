import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-white border-[#E3E3E3] text-[#061623]",
        success:
          "bg-[#F0FDF4] border-[#30714C]/30 text-[#30714C] [&>svg]:text-[#30714C]",
        warning:
          "bg-[#FFF3CD] border-[#DDC66F]/50 text-[#7C6A2D] [&>svg]:text-[#DDC66F]",
        error:
          "bg-[#FFEDED] border-[#C1201C]/30 text-[#C1201C] [&>svg]:text-[#C1201C]",
        info:
          "bg-[#EFF6FF] border-[#3B82F6]/30 text-[#1E40AF] [&>svg]:text-[#3B82F6]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      onClose?: () => void
    }
>(({ className, variant, onClose, children, ...props }, ref) => {
  const Icon = {
    default: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  }[variant || "default"]

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
