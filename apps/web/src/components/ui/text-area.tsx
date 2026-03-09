import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  message?: string | undefined;
};

export const TextArea = ({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  id,
  label,
  message,
  required,
  ...props
}: TextAreaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = message ? `${textareaId}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      className="flex flex-col gap-2 text-sm font-medium text-steel-600"
      htmlFor={textareaId}
    >
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {required ? (
          <span className="data-label rounded-full bg-steel-100 px-2 py-1 text-[10px] text-steel-600">
            Required
          </span>
        ) : null}
      </span>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? Boolean(message)}
        className={cn(
          "min-h-32 rounded-2xl border border-steel-200 bg-white px-4 py-3 text-base text-steel-900 outline-none transition placeholder:text-steel-400 focus:border-steel-900 focus:ring-2 focus:ring-steel-100",
          className,
        )}
        id={textareaId}
        required={required}
        {...props}
      />
      {message ? (
        <span className="text-sm text-rose-600" id={messageId}>
          {message}
        </span>
      ) : null}
    </label>
  );
};
