import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  message?: string | undefined;
};

export const TextInput = ({
  className,
  label,
  message,
  ...props
}: TextInputProps) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-steel-600">
    <span>{label}</span>
    <input
      className={cn(
        "min-h-14 rounded-2xl border border-steel-200 bg-white px-4 text-base text-steel-900 outline-none transition placeholder:text-steel-400 focus:border-steel-900 focus:ring-2 focus:ring-steel-100",
        className,
      )}
      {...props}
    />
    {message ? <span className="text-sm text-rose-600">{message}</span> : null}
  </label>
);
