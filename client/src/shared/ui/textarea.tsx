import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        // Update both refs
        if (textareaRef) {
          textareaRef.current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea && autoResize) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [autoResize])

    React.useEffect(() => {
      if (autoResize) {
        adjustHeight()
      }
    }, [autoResize, adjustHeight, props.value])

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#E3E3E3] bg-white px-3 py-2 text-sm text-[#061623] placeholder:text-[#A0A0A0] transition-colors focus-visible:outline-none focus-visible:border-[#30714C] focus-visible:ring-2 focus-visible:ring-[#30714C]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[#C1201C] aria-[invalid=true]:focus-visible:ring-[#C1201C]/20",
          autoResize && "resize-none overflow-hidden",
          className
        )}
        ref={combinedRef}
        onInput={autoResize ? adjustHeight : undefined}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
