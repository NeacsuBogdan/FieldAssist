import type { SelectHTMLAttributes } from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  message?: string | undefined;
  options: readonly SelectOption[];
};

export const SelectInput = ({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  id,
  label,
  message,
  options,
  required,
  ...props
}: SelectInputProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = message ? `${selectId}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      className="flex flex-col gap-2 text-sm font-medium text-steel-600"
      htmlFor={selectId}
    >
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {required ? (
          <span className="data-label rounded-full bg-steel-100 px-2 py-1 text-[10px] text-steel-600">
            Required
          </span>
        ) : null}
      </span>
      <select
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? Boolean(message)}
        className={cn(
          "min-h-14 rounded-2xl border border-steel-200 bg-white px-4 text-base text-steel-900 outline-none transition focus:border-steel-900 focus:ring-2 focus:ring-steel-100",
          className,
        )}
        id={selectId}
        required={required}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {message ? (
        <span className="text-sm text-rose-600" id={messageId}>
          {message}
        </span>
      ) : null}
    </label>
  );
};
