"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Composant utilitaire pour un champ de texte dans un formulaire
 * Utilise react-hook-form et affiche automatiquement les erreurs
 */
interface FormInputFieldProps
  extends Omit<React.ComponentProps<typeof Input>, "name"> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormInputField({
  name,
  label,
  description,
  required,
  className,
  ...props
}: FormInputFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              {...props}
              className={cn(
                // Ajout du support mode nuit via bg-background et border-input
                "bg-background text-foreground border-input dark:bg-slate-900 dark:text-white",
                className
              )}
              aria-required={required}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Composant utilitaire pour un champ email
 */
interface FormEmailFieldProps
  extends Omit<FormInputFieldProps, "type"> {}

export function FormEmailField(props: FormEmailFieldProps) {
  return <FormInputField type="email" autoComplete="email" {...props} />;
}

/**
 * Composant utilitaire pour un champ mot de passe
 */
interface FormPasswordFieldProps
  extends Omit<FormInputFieldProps, "type"> {}

export function FormPasswordField(props: FormPasswordFieldProps) {
  return (
    <FormInputField
      type="password"
      autoComplete="current-password"
      {...props}
    />
  );
}

/**
 * Composant utilitaire pour un champ textarea
 */
interface FormTextareaFieldProps
  extends Omit<React.ComponentProps<"textarea">, "name"> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function FormTextareaField({
  name,
  label,
  description,
  required,
  className,
  ...props
}: FormTextareaFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <textarea
              {...field}
              {...props}
              className={cn(
                // Ajout du support mode nuit via bg-background et border-input
                "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input min-h-[80px] w-full rounded-md border bg-background text-foreground px-3 py-2 text-base transition-[color,colors] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "dark:bg-slate-900 dark:text-white dark:border-slate-700",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className
              )}
              aria-required={required}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Composant utilitaire pour un champ numérique
 */
interface FormNumberFieldProps
  extends Omit<FormInputFieldProps, "type"> {
  min?: number;
  max?: number;
  step?: number;
}

export function FormNumberField({
  min,
  max,
  step,
  ...props
}: FormNumberFieldProps) {
  return (
    <FormInputField
      type="number"
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}

/**
 * Composant utilitaire pour un champ date
 */
interface FormDateFieldProps
  extends Omit<FormInputFieldProps, "type"> {
  min?: string;
  max?: string;
}

export function FormDateField({ min, max, ...props }: FormDateFieldProps) {
  return <FormInputField type="date" min={min} max={max} {...props} />;
}

/**
 * Composant utilitaire pour un champ select
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

interface FormSelectFieldProps
  extends Omit<React.ComponentProps<"select">, "name"> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export function FormSelectField({
  name,
  label,
  description,
  required,
  options,
  placeholder,
  className,
  ...props
}: FormSelectFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <select
              {...field}
              {...props}
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                // Convert to number if the value is numeric
                const numValue = Number(value);
                field.onChange(value === '' ? undefined : (!isNaN(numValue) && value !== '' ? numValue : value));
              }}
              className={cn(
                // Ajout du support mode nuit
                "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-9 w-full rounded-md border bg-background text-foreground px-3 py-1 text-base transition-[color,colors] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "dark:bg-slate-900 dark:text-white dark:border-slate-700",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className
              )}
              aria-required={required}
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
