'use client';

import type { ReactNode } from 'react';
import { type ComboboxOption } from '@/components/ui/combobox';
import { FilterCombobox } from '@/components/ui/filter-combobox';

interface RankingFilterFieldProps {
  label: ReactNode;
  options: readonly ComboboxOption[];
  value: string;
  placeholder: string;
  emptyText: string;
  clearLabel?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

export function RankingFilterField({
  label,
  options,
  value,
  placeholder,
  emptyText,
  clearLabel,
  disabled = false,
  onValueChange,
}: RankingFilterFieldProps) {
  return (
    <div className="w-full">
      <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      <FilterCombobox
        options={options}
        value={value}
        placeholder={placeholder}
        emptyText={emptyText}
        clearLabel={clearLabel}
        disabled={disabled}
        onValueChange={onValueChange}
      />
    </div>
  );
}
