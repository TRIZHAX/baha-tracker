import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: "default" | "compact" | "icon"
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cyan-700 text-white shadow-soft hover:bg-cyan-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400",
  secondary: "border bg-white/80 text-slate-900 shadow-soft hover:bg-slate-50 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800",
  danger: "bg-red-600 text-white shadow-soft hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400",
  ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
}

const sizes = {
  default: "min-h-12 px-5 py-3",
  compact: "min-h-11 px-4 py-2",
  icon: "h-11 w-11"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => (
  <button ref={ref} type={type} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />
))

Button.displayName = "Button"
