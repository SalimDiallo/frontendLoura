/**
 * Composant DataTable générique et réutilisable
 * Élimine la duplication de code dans ~30 pages de listes
 */

import React, { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

/**
 * Définition d'une colonne du tableau
 */
export interface DataTableColumn<T> {
  /** Clé unique de la colonne */
  key: string;
  
  /** Libellé affiché dans l'en-tête */
  header: string | ReactNode;
  
  /** Fonction pour rendre le contenu de la cellule */
  cell: (item: T) => ReactNode;
  
  /** La colonne est-elle triable ? */
  sortable?: boolean;
  
  /** Fonction de tri personnalisée (optionnelle) */
  sortFn?: (a: T, b: T) => number;
  
  /** Alignement du contenu */
  align?: "left" | "center" | "right";
  
  /** Largeur de la colonne (CSS) */
  width?: string;
  
  /** Classes CSS personnalisées pour la cellule */
  className?: string;
  
  /** Classes CSS personnalisées pour l'en-tête */
  headerClassName?: string;
}

/**
 * Configuration du tri
 */
export interface SortConfig {
  /** Clé de la colonne triée */
  key: string;
  
  /** Direction du tri */
  direction: "asc" | "desc";
}

/**
 * Props du  composant DataTable
 */
export interface DataTableProps<T> {
  /** Données à afficher */
  data: T[];
  
  /** Configuration des colonnes */
  columns: DataTableColumn<T>[];
  
  /** Fonction pour obtenir l'ID unique d'un élément */
  getRowId: (item: T) => string;
  
  /** Callback appelé quand une ligne est cliquée */
  onRowClick?: (item: T) => void;
  
  /** Callback appelé quand une ligne est double-cliquée */
  onRowDoubleClick?: (item: T) => void;
  
  /** Index de la ligne sélectionnée */
  selectedIndex?: number;
  
  /** Callback pour changer la ligne sélectionnée */
  onSelectRow?: (index: number) => void;
  
  /** Configuration du tri actuel */
  sortConfig?: SortConfig;
  
  /** Callback pour changer le tri */
  onSort?: (key: string) => void;
  
  /** Message affiché quand il n'y a pas de données */
  emptyMessage?: string | ReactNode;
  
  /** Icône affichée quand il n'y a pas de données */
  emptyIcon?: ReactNode;
  
  /** Classes CSS personnalisées pour le tableau */
  className?: string;
  
  /** Activer le survol des lignes */
  hoverable?: boolean;
  
  /** Activer la sélection des lignes */
  selectable?: boolean;
}

/**
 * Composant DataTable générique
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  onRowDoubleClick,
  selectedIndex = -1,
  onSelectRow,
  sortConfig,
  onSort,
  emptyMessage = "Aucune donnée disponible",
  emptyIcon,
  className,
  hoverable = true,
  selectable = true,
}: DataTableProps<T>) {
  /**
   * Gère le clic sur une en-tête de colonne pour le tri
   */
  const handleHeaderClick = (column: DataTableColumn<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  /**
   * Rendu de l'icône de tri pour une colonne
   */
  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;

    const isSorted = sortConfig?.key === column.key;
    
    if (!isSorted) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }

    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  /**
   * Rendu du contenu vide
   */
  if (data.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border/50 bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.headerClassName
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center p-12 text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-4">
                  {emptyIcon && <div className="opacity-50">{emptyIcon}</div>}
                  <div>{emptyMessage}</div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  /**
   * Rendu du tableau avec des données
   */
  return (
    <div className={cn("rounded-lg border border-border/50 bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.sortable && "cursor-pointer select-none",
                  sortConfig?.key === column.key && "text-primary",
                  column.headerClassName
                )}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => handleHeaderClick(column)}
                data-active={sortConfig?.key === column.key}
              >
                <div className="flex items-center">
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const rowId = getRowId(item);
            const isSelected = selectedIndex === index;

            return (
              <TableRow
                key={rowId}
                data-state={isSelected ? "selected" : undefined}
                className={cn(
                  hoverable && "cursor-pointer",
                  selectable && isSelected && "bg-primary/10 ring-2 ring-primary ring-inset"
                )}
                onClick={() => {
                  if (onRowClick) onRowClick(item);
                  if (onSelectRow) onSelectRow(index);
                }}
                onDoubleClick={() => onRowDoubleClick?.(item)}
                tabIndex={selectable ? 0 : undefined}
                role={selectable ? "button" : undefined}
                aria-selected={isSelected}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.className
                    )}
                  >
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Hook pour gérer le tri local
 */
export function useTableSort<T>(
  data: T[],
  columns: DataTableColumn<T>[]
): {
  sortedData: T[];
  sortConfig: SortConfig | undefined;
  handleSort: (key: string) => void;
} {
  const [sortConfig, setSortConfig] = React.useState<SortConfig | undefined>();

  const handleSort = React.useCallback((key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        // Toggle direction
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      // New sort column
      return { key, direction: "asc" };
    });
  }, []);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    const column = columns.find((col) => col.key === sortConfig.key);
    if (!column?.sortable) return data;

    const sorted = [...data].sort((a, b) => {
      // Use custom sort function if provided
      if (column.sortFn) {
        return column.sortFn(a, b);
      }

      // Default sort: compare string representations
      const aValue = String(column.cell(a));
      const bValue = String(column.cell(b));
      
      return aValue.localeCompare(bValue);
    });

    return sortConfig.direction === "desc" ? sorted.reverse() : sorted;
  }, [data, sortConfig, columns]);

  return { sortedData, sortConfig, handleSort };
}
