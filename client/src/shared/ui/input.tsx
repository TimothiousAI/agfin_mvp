import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#E3E3E3] bg-white px-3 py-2 text-sm text-[#061623] placeholder:text-[#A0A0A0] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#061623] focus-visible:outline-none focus-visible:border-[#30714C] focus-visible:ring-2 focus-visible:ring-[#30714C]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[#C1201C] aria-[invalid=true]:focus-visible:ring-[#C1201C]/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
