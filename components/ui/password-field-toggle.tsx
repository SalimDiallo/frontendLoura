'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordFieldWithToggleProps {
  name: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export function PasswordFieldWithToggle({ 
  name, 
  label, 
  placeholder = '••••••••',
  autoComplete,
  required = false,
  description,
  className,
}: PasswordFieldWithToggleProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          {...register(name)}
          type={showPassword ? "text" : "password"}
          id={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 pr-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}

export default PasswordFieldWithToggle;
