"use client";

import {
  HiOutlineMagnifyingGlass,

} from "react-icons/hi2";
import { Card, Input } from "@/components/ui";

import { SmartFilters, FilterConfig } from "@/components/ui/smart-filters";



export function EmployeesSearchAndFilters({
  searchInputRef,
  searchQuery,
  setSearchQuery,
  filterConfigs,
  filters,
  handleFilterChange,
  handleResetFilters,
}: {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterConfigs: FilterConfig[];
  filters: Record<string, any>;
  handleFilterChange: (key: string, value: string | string[]) => void;
  handleResetFilters: () => void;
}) {
  return (
    <Card className="p-2 border-0 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mb-2">
        <div className="relative flex-1 w-full">
          <HiOutlineMagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Rechercher par nom, email ou matricule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-12 text-sm h-8"
            aria-label="Rechercher des employés"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1 font-mono text-[11px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>
      <SmartFilters
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        quickFilterKey="status"
      />
    </Card>
  );
}
