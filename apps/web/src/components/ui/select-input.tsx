import type { SelectHTMLAttributes } from "react";

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
  className,
  label,
  message,
  options,
  ...props
}: SelectInputProps) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-steel-600">
    <span>{label}</span>
    <select
      className={cn(
        "min-h-14 rounded-2xl border border-steel-200 bg-white px-4 text-base text-steel-900 outline-none transition focus:border-steel-900 focus:ring-2 focus:ring-steel-100",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {message ? <span className="text-sm text-rose-600">{message}</span> : null}
  </label>
);
