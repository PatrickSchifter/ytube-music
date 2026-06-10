import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

/**
 * Slider acessível baseado em <input type="range">.
 * Estilização do trilho/thumb fica a cargo do app via CSS (classe `.ytune-range`).
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
  ...props
}: SliderProps) {
  return (
    <input
      type="range"
      className={cn("ytune-range w-full cursor-pointer", className)}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      {...props}
    />
  );
}
