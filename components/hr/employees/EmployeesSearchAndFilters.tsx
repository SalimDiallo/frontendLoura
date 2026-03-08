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
    <Card className="p-4 border shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-3">
        <div className="relative flex-1 w-full">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Rechercher par nom, email ou matricule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-14 text-sm h-10"
            aria-label="Rechercher des employés"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
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
