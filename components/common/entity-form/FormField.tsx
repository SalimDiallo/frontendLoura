/**
 * Champ de formulaire générique avec label et gestion d'erreur
 */

import { Input, Label } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'password' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  error?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  error,
  help,
  min,
  max,
  step,
  className,
  multiline = false,
  rows = 3,
}: FormFieldProps) {
  const InputComponent = multiline ? 'textarea' : Input;

  return (
    <div className={className}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative mt-1.5">
        {Icon && !multiline && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}

        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        ) : (
          <Input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={Icon ? 'pl-10' : ''}
          />
        )}
      </div>

      {help && !error && <p className="text-xs text-muted-foreground mt-1.5">{help}</p>}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
