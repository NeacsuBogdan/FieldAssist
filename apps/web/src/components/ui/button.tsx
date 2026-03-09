import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "primary" | "secondary";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  ghost:
    "border-transparent bg-transparent text-steel-600 hover:border-steel-200 hover:bg-white/70",
  primary:
    "border-transparent bg-steel-900 text-white hover:bg-steel-600 focus-visible:ring-steel-900",
  secondary:
    "border-steel-200 bg-white text-steel-900 hover:border-steel-400 hover:bg-steel-50",
};

export const Button = ({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex min-h-12 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      className,
    )}
    type={type}
    {...props}
  />
);
