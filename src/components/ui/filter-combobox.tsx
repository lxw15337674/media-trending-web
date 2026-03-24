'use client';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  type ComboboxOption,
} from '@/components/ui/combobox';

interface FilterComboboxProps {
  options: readonly ComboboxOption[];
  value: string;
  placeholder: string;
  emptyText: string;
  clearLabel?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

export function FilterCombobox({
  options,
  value,
  placeholder,
  emptyText,
  clearLabel,
  disabled = false,
  onValueChange,
}: FilterComboboxProps) {
  return (
    <Combobox items={options} value={value} disabled={disabled} onValueChange={(nextValue) => onValueChange(nextValue)}>
      <ComboboxInput placeholder={placeholder} clearLabel={clearLabel} disabled={disabled} />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(rawItem) => {
            const item = rawItem as ComboboxOption;
            return (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

