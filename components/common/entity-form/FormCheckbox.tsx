/**
 * Champ checkbox avec label
 */

import { Label } from '@/components/ui';

interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  help?: string;
  className?: string;
}

export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  help,
  className,
}: FormCheckboxProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Label htmlFor={name} className="cursor-pointer">
          {label}
        </Label>
      </div>
      {help && <p className="text-xs text-muted-foreground mt-1.5 ml-6">{help}</p>}
    </div>
  );
}
