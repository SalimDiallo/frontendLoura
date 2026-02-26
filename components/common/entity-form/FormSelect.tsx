/**
 * Champ select/dropdown avec label
 */

import { Label } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface FormSelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string | number | undefined | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  error?: string;
  help?: string;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  required = false,
  disabled = false,
  icon: Icon,
  error,
  help,
  className,
}: FormSelectProps) {
  return (
    <div className={className}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative mt-1.5">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <select
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${Icon ? 'pl-10' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {help && !error && <p className="text-xs text-muted-foreground mt-1.5">{help}</p>}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
