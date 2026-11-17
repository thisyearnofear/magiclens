import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Theme-var utilities (bg-primary, text-muted-foreground, border-accent, …) are
// custom names tailwind-merge can't dedupe against palette overrides, so the
// var-colored base bleeds through e.g. `bg-green-500/20`. Teach the merge that
// these are color classes so later overrides win like normal Tailwind.
const THEME_COLORS = [
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "destructive",
  "destructive-foreground",
  "accent",
  "accent-foreground",
  "muted",
  "muted-foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "background",
  "foreground",
  "ring",
  "input",
  "border",
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "bg-color": THEME_COLORS.map((c) => `bg-${c}`),
      "text-color": THEME_COLORS.map((c) => `text-${c}`),
      "border-color": THEME_COLORS.map((c) => `border-${c}`),
      "ring-color": THEME_COLORS.map((c) => `ring-${c}`),
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
