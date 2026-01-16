import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Search, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Command {
  id: string
  label: string
  description?: string
  group: 'navigation' | 'actions' | 'recent' | 'documents'
  keywords?: string[]
  onSelect: () => void
  icon?: React.ReactNode
}

interface CommandPaletteProps {
  commands: Command[]
  recentCommands?: string[] // Command IDs
  placeholder?: string
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({
  commands,
  recentCommands = [],
  placeholder = "Search commands...",
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])
  const [search, setSearch] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Global keyboard shortcut: Cmd/Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-focus input when opened
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Reset state when closed
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedIndex(0)
    }
  }, [open])

  // Fuzzy search implementation
  const fuzzyMatch = (text: string, query: string): boolean => {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    // Empty query matches everything
    if (!queryLower) return true

    // Exact substring match
    if (textLower.includes(queryLower)) return true

    // Fuzzy match: all characters in order
    let textIndex = 0
    for (let i = 0; i < queryLower.length; i++) {
      const char = queryLower[i]
      const foundIndex = textLower.indexOf(char, textIndex)
      if (foundIndex === -1) return false
      textIndex = foundIndex + 1
    }
    return true
  }

  // Filter and group commands
  const filteredCommands = React.useMemo(() => {
    const recent = commands.filter(cmd =>
      recentCommands.includes(cmd.id) &&
      (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
    ).map(cmd => ({ ...cmd, group: 'recent' as const }))

    const navigation = commands.filter(cmd =>
      cmd.group === 'navigation' &&
      !recentCommands.includes(cmd.id) &&
      (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
    )

    const documents = commands.filter(cmd =>
      cmd.group === 'documents' &&
      !recentCommands.includes(cmd.id) &&
      (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
    )

    const actions = commands.filter(cmd =>
      cmd.group === 'actions' &&
      !recentCommands.includes(cmd.id) &&
      (fuzzyMatch(cmd.label, search) || (cmd.keywords?.some(k => fuzzyMatch(k, search))))
    )

    return { recent, navigation, documents, actions }
  }, [commands, recentCommands, search])

  const allResults = [
    ...filteredCommands.recent,
    ...filteredCommands.navigation,
    ...filteredCommands.documents,
    ...filteredCommands.actions
  ]

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % allResults.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length)
        break
      case 'Enter':
        e.preventDefault()
        if (allResults[selectedIndex]) {
          allResults[selectedIndex].onSelect()
          setOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  // Reset selection when search changes
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const renderGroup = (title: string, commands: Command[], startIndex: number) => {
    if (commands.length === 0) return null

    return (
      <div key={title} className="mb-2">
        <div className="px-3 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          {title}
        </div>
        <div className="space-y-1">
          {commands.map((command, idx) => {
            const globalIndex = startIndex + idx
            const isSelected = globalIndex === selectedIndex

            return (
              <button
                key={command.id}
                data-index={globalIndex}
                onClick={() => {
                  command.onSelect()
                  setOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-md transition-colors",
                  isSelected
                    ? "bg-[#30714C] text-white"
                    : "text-[#061623] hover:bg-[#F3F4F6]"
                )}
              >
                {command.icon && (
                  <span className={cn(
                    "flex-shrink-0",
                    isSelected ? "text-white" : "text-[#6B7280]"
                  )}>
                    {command.icon}
                  </span>
                )}
                {title === 'Recent' && !command.icon && (
                  <Clock className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isSelected ? "text-white" : "text-[#6B7280]"
                  )} />
                )}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium truncate",
                    isSelected ? "text-white" : "text-[#061623]"
                  )}>
                    {command.label}
                  </div>
                  {command.description && (
                    <div className={cn(
                      "text-xs truncate mt-0.5",
                      isSelected ? "text-white/80" : "text-[#6B7280]"
                    )}>
                      {command.description}
                    </div>
                  )}
                </div>
                <ArrowRight className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isSelected ? "text-white" : "text-[#A0A0A0]"
                )} />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[20%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-20%] bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[18%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[18%] rounded-xl border border-[#E3E3E3] overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Accessible title (hidden visually) */}
          <DialogPrimitive.Title className="sr-only">
            Command Palette
          </DialogPrimitive.Title>

          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E3E3E3]">
            <Search className="h-5 w-5 text-[#6B7280] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-[#061623] placeholder:text-[#A0A0A0] text-base outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-[#6B7280] bg-[#F3F4F6] rounded border border-[#E3E3E3]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {allResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
                No commands found
              </div>
            ) : (
              <>
                {renderGroup('Recent', filteredCommands.recent, 0)}
                {renderGroup('Navigation', filteredCommands.navigation, filteredCommands.recent.length)}
                {renderGroup('Documents', filteredCommands.documents, filteredCommands.recent.length + filteredCommands.navigation.length)}
                {renderGroup('Actions', filteredCommands.actions, filteredCommands.recent.length + filteredCommands.navigation.length + filteredCommands.documents.length)}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#E3E3E3] bg-[#F9FAFB] text-xs text-[#6B7280]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-[#E3E3E3]">↑</kbd>
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-[#E3E3E3]">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white rounded border border-[#E3E3E3]">↵</kbd>
                to select
              </span>
            </div>
            <span className="text-[#A0A0A0]">
              {allResults.length} {allResults.length === 1 ? 'command' : 'commands'}
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
