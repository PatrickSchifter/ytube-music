import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "ghost" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-black rounded-full px-5 py-2 hover:bg-brand/90",
  ghost: "bg-transparent text-zinc-200 rounded-full px-4 py-2 hover:bg-white/10",
  icon: "bg-transparent text-zinc-200 rounded-full h-10 w-10 hover:bg-white/10",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
