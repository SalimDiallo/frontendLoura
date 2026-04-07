"use client";

import { Button, Card, Input } from "@/components/ui";
import {
    HiOutlineMagnifyingGlass
} from "react-icons/hi2";

// Composant : Recherche et boutons filtre
export function ContractsSearchFilter({
  searchInputRef,
  searchQuery,
  setSearchQuery,
  filterActive,
  setFilterActive,
  loadContracts,
}: {
  searchInputRef: React.RefObject<HTMLInputElement | null>,
  searchQuery: string,
  setSearchQuery: (v: string) => void,
  filterActive: boolean|null,
  setFilterActive: (v: boolean|null) => void,
  loadContracts: () => void,
}) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Rechercher par employé ou type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-20"
            aria-label="Rechercher des contrats"
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterActive === true ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterActive(filterActive === true ? null : true);
              loadContracts();
            }}
          >
            Actifs
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">A</kbd>
          </Button>
          <Button
            variant={filterActive === false ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterActive(filterActive === false ? null : false);
              loadContracts();
            }}
          >
            Inactifs
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted/50 px-1 font-mono text-xs">I</kbd>
          </Button>
        </div>
      </div>
    </Card>
  )
}
