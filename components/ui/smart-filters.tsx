"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineChevronDown,
  HiOutlineCheck,
} from "react-icons/hi2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ============================================
// Types
// ============================================

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  type?: "single" | "multi";
}

interface SmartFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string | string[]>;
  onChange: (key: string, value: string | string[]) => void;
  onReset: () => void;
  /** Quick filter pills for most important filter */
  quickFilterKey?: string;
  className?: string;
}

// ============================================
// Filter Dropdown Component
// ============================================

function FilterDropdown({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}) {
  const isMulti = filter.type === "multi";
  
  const selectedValues = useMemo(() => {
    if (isMulti) {
      return Array.isArray(value) ? value : [];
    }
    return typeof value === "string" ? value : "";
  }, [isMulti, value]);

  const selectedCount = isMulti
    ? (selectedValues as string[]).length
    : selectedValues
      ? 1
      : 0;

  const selectedLabel = useMemo(() => {
    if (isMulti) {
      const selected = selectedValues as string[];
      if (selected.length === 0) return filter.label;
      if (selected.length === 1) {
        return filter.options.find((o) => o.value === selected[0])?.label || selected[0];
      }
      return `${selected.length} sélectionnés`;
    } else {
      if (!selectedValues) return filter.label;
      return filter.options.find((o) => o.value === selectedValues)?.label || selectedValues;
    }
  }, [filter, selectedValues, isMulti]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (isMulti) {
        const current = Array.isArray(value) ? value : [];
        if (current.includes(optionValue)) {
          onChange(current.filter((v) => v !== optionValue));
        } else {
          onChange([...current, optionValue]);
        }
      } else {
        onChange(optionValue === value ? "" : optionValue);
      }
    },
    [isMulti, value, onChange]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            "border hover:bg-muted/50",
            selectedCount > 0
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-background border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {filter.icon}
          <span className="max-w-24 truncate">{selectedLabel}</span>
          {selectedCount > 0 && isMulti && (
            <Badge variant="secondary" className="size-5 p-0 text-[10px] justify-center">
              {selectedCount}
            </Badge>
          )}
          <HiOutlineChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {/* Clear option for single select */}
        {!isMulti && selectedValues && (
          <>
            <DropdownMenuItem onClick={() => onChange("")}>
              <HiOutlineXMark className="size-4 mr-2" />
              Effacer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {filter.options
          .filter((o) => o.value !== "")
          .map((option) => {
            const isSelected = isMulti
              ? (selectedValues as string[]).includes(option.value)
              : selectedValues === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(isSelected && "bg-primary/10")}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {option.count}
                      </span>
                    )}
                    {isSelected && <HiOutlineCheck className="size-4 text-primary" />}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================
// Quick Filter Pills
// ============================================

function QuickFilterPills({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filter.options
        .filter((o) => o.value !== "")
        .slice(0, 5)
        .map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(isSelected ? "" : option.value)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {option.icon}
              {option.label}
              {option.count !== undefined && (
                <span className="opacity-70">({option.count})</span>
              )}
            </button>
          );
        })}
    </div>
  );
}

// ============================================
// Active Filters Summary
// ============================================

function ActiveFiltersBadges({
  filters,
  values,
  onChange,
  onReset,
}: {
  filters: FilterConfig[];
  values: Record<string, string | string[]>;
  onChange: (key: string, value: string | string[]) => void;
  onReset: () => void;
}) {
  const activeFilters = useMemo(() => {
    const active: { key: string; filterLabel: string; value: string; valueLabel: string }[] = [];

    filters.forEach((filter) => {
      const val = values[filter.key];
      if (!val || (Array.isArray(val) && val.length === 0)) return;

      if (Array.isArray(val)) {
        val.forEach((v) => {
          const opt = filter.options.find((o) => o.value === v);
          if (opt) {
            active.push({
              key: filter.key,
              filterLabel: filter.label,
              value: v,
              valueLabel: opt.label,
            });
          }
        });
      } else {
        const opt = filter.options.find((o) => o.value === val);
        if (opt) {
          active.push({
            key: filter.key,
            filterLabel: filter.label,
            value: val,
            valueLabel: opt.label,
          });
        }
      }
    });

    return active;
  }, [filters, values]);

  if (activeFilters.length === 0) return null;

  const handleRemove = (key: string, valueToRemove: string) => {
    const currentValue = values[key];
    if (Array.isArray(currentValue)) {
      onChange(key, currentValue.filter((v) => v !== valueToRemove));
    } else {
      onChange(key, "");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Filtres actifs:</span>
      {activeFilters.map((af, i) => (
        <Badge
          key={`${af.key}-${af.value}-${i}`}
          variant="secondary"
          className="pl-2 pr-1 py-0.5 gap-1 text-xs bg-primary/10 text-primary border-primary/20"
        >
          <span className="font-normal text-primary/70">{af.filterLabel}:</span>
          {af.valueLabel}
          <button
            onClick={() => handleRemove(af.key, af.value)}
            className="ml-0.5 p-0.5 hover:bg-primary/20 rounded"
          >
            <HiOutlineXMark className="size-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Effacer tout
      </Button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function SmartFilters({
  filters,
  values,
  onChange,
  onReset,
  quickFilterKey,
  className,
}: SmartFiltersProps) {
  const [showAllFilters, setShowAllFilters] = useState(false);

  const quickFilter = quickFilterKey
    ? filters.find((f) => f.key === quickFilterKey)
    : null;

  const otherFilters = quickFilter
    ? filters.filter((f) => f.key !== quickFilterKey)
    : filters;

  const hasAnyFilter = useMemo(() => {
    return Object.entries(values).some(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      return !!v;
    });
  }, [values]);

  // Count active filters (excluding quick filter)
  const activeOtherFiltersCount = useMemo(() => {
    return otherFilters.reduce((count, f) => {
      const val = values[f.key];
      if (Array.isArray(val)) return count + val.length;
      return count + (val ? 1 : 0);
    }, 0);
  }, [otherFilters, values]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Row 1: Quick filters + Toggle more */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Quick filter pills */}
        {quickFilter && (
          <QuickFilterPills
            filter={quickFilter}
            value={typeof values[quickFilter.key] === "string" ? values[quickFilter.key] as string : ""}
            onChange={(v) => onChange(quickFilter.key, v)}
          />
        )}

        {/* Toggle more filters button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllFilters(!showAllFilters)}
          className={cn(
            "gap-1.5 h-8",
            showAllFilters && "bg-muted",
            activeOtherFiltersCount > 0 && "border-primary/30"
          )}
        >
          <HiOutlineFunnel className="size-4" />
          Plus de filtres
          {activeOtherFiltersCount > 0 && (
            <Badge variant="default" className="size-5 p-0 text-[10px] justify-center">
              {activeOtherFiltersCount}
            </Badge>
          )}
          <HiOutlineChevronDown
            className={cn(
              "size-3.5 transition-transform",
              showAllFilters && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Row 2: Expanded filters */}
      {showAllFilters && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/30 rounded-lg border border-border/50">
          {otherFilters.map((filter) => (
            <FilterDropdown
              key={filter.key}
              filter={filter}
              value={values[filter.key] || (filter.type === "multi" ? [] : "")}
              onChange={(v) => onChange(filter.key, v)}
            />
          ))}
        </div>
      )}

      {/* Row 3: Active filters badges */}
      {hasAnyFilter && (
        <ActiveFiltersBadges
          filters={filters}
          values={values}
          onChange={onChange}
          onReset={onReset}
        />
      )}
    </div>
  );
}

export default SmartFilters;
