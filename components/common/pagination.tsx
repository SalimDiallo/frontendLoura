'use client';

/**
 * Composant de pagination réutilisable
 * Remplace les implémentations ad-hoc (ex: EmployeesPagination)
 *
 * Usage:
 * ```tsx
 * <Pagination
 *   currentPage={currentPage}
 *   totalCount={totalCount}
 *   pageSize={10}
 *   onPageChange={setPage}
 *   hasNext={hasNext}
 *   hasPrevious={hasPrevious}
 *   loading={loading}
 * />
 * ```
 */

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
    HiOutlineChevronDoubleLeft,
    HiOutlineChevronDoubleRight,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
} from 'react-icons/hi2';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationProps {
    /** Page courante (1-indexed) */
    currentPage: number;
    /** Nombre total d'éléments */
    totalCount: number;
    /** Nombre d'éléments par page */
    pageSize?: number;
    /** Callback lors du changement de page */
    onPageChange: (page: number) => void;
    /** Indique s'il y a une page suivante */
    hasNext?: boolean;
    /** Indique s'il y a une page précédente */
    hasPrevious?: boolean;
    /** État de chargement */
    loading?: boolean;
    /** Label pour le type d'éléments (défaut: "éléments") */
    itemLabel?: string;
    /** Variante d'affichage */
    variant?: 'default' | 'compact' | 'minimal';
    /** Classes CSS additionnelles */
    className?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function Pagination({
    currentPage,
    totalCount,
    pageSize = 10,
    onPageChange,
    hasNext,
    hasPrevious,
    loading = false,
    itemLabel = 'éléments',
    variant = 'default',
    className,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Calculer hasNext/hasPrevious si pas fournis explicitement
    const canGoNext = hasNext ?? currentPage < totalPages;
    const canGoPrevious = hasPrevious ?? currentPage > 1;

    // Range d'éléments affichés
    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    if (totalCount === 0) return null;

    // Variante minimale : juste les boutons
    if (variant === 'minimal') {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrevious || loading}
                >
                    <HiOutlineChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {currentPage}/{totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext || loading}
                >
                    <HiOutlineChevronRight className="size-4" />
                </Button>
            </div>
        );
    }

    // Variante compacte
    if (variant === 'compact') {
        return (
            <div className={cn('flex items-center justify-between', className)}>
                <p className="text-xs text-muted-foreground">
                    {startItem}-{endItem} sur {totalCount}
                </p>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!canGoPrevious || loading}
                    >
                        <HiOutlineChevronLeft className="size-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 tabular-nums min-w-[3rem] text-center">
                        {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!canGoNext || loading}
                    >
                        <HiOutlineChevronRight className="size-4" />
                    </Button>
                </div>
            </div>
        );
    }

    // Variante default (complète)
    return (
        <div className={cn(
            'flex items-center justify-between px-2 py-3',
            className
        )}>
            {/* Info */}
            <p className="text-sm text-muted-foreground">
                <span className="font-medium tabular-nums">{startItem}</span>
                {' - '}
                <span className="font-medium tabular-nums">{endItem}</span>
                {' sur '}
                <span className="font-medium tabular-nums">{totalCount}</span>
                {' '}{itemLabel}
            </p>

            {/* Contrôles */}
            <div className="flex items-center gap-1">
                {/* Première page */}
                {totalPages > 2 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || loading}
                        title="Première page"
                    >
                        <HiOutlineChevronDoubleLeft className="size-3.5" />
                    </Button>
                )}

                {/* Page précédente */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrevious || loading}
                >
                    <HiOutlineChevronLeft className="size-4 mr-1" />
                    <span className="text-xs">Préc.</span>
                </Button>

                {/* Numéros de pages */}
                <PageNumbers
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    loading={loading}
                />

                {/* Page suivante */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext || loading}
                >
                    <span className="text-xs">Suiv.</span>
                    <HiOutlineChevronRight className="size-4 ml-1" />
                </Button>

                {/* Dernière page */}
                {totalPages > 2 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages || loading}
                        title="Dernière page"
                    >
                        <HiOutlineChevronDoubleRight className="size-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// PAGE NUMBERS
// ============================================================================

function PageNumbers({
    currentPage,
    totalPages,
    onPageChange,
    loading,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading: boolean;
}) {
    // Ne pas afficher si une seule page
    if (totalPages <= 1) return null;

    // Calculer les pages à afficher (max 5 boutons + ellipses)
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
        // Afficher toutes les pages
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        // Toujours afficher la première page
        pages.push(1);

        if (currentPage > 3) {
            pages.push('ellipsis');
        }

        // Pages autour de la page courante
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push('ellipsis');
        }

        // Toujours afficher la dernière page
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center gap-0.5">
            {pages.map((page, index) => {
                if (page === 'ellipsis') {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground"
                        >
                            …
                        </span>
                    );
                }

                return (
                    <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                            'h-8 w-8 p-0 text-xs tabular-nums',
                            page === currentPage && 'pointer-events-none'
                        )}
                        onClick={() => onPageChange(page)}
                        disabled={loading}
                    >
                        {page}
                    </Button>
                );
            })}
        </div>
    );
}
