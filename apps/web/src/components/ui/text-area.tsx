import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  message?: string | undefined;
};

export const TextArea = ({
  className,
  label,
  message,
  ...props
}: TextAreaProps) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-steel-600">
    <span>{label}</span>
    <textarea
      className={cn(
        "min-h-32 rounded-2xl border border-steel-200 bg-white px-4 py-3 text-base text-steel-900 outline-none transition placeholder:text-steel-400 focus:border-steel-900 focus:ring-2 focus:ring-steel-100",
        className,
      )}
      {...props}
    />
    {message ? <span className="text-sm text-rose-600">{message}</span> : null}
  </label>
);
