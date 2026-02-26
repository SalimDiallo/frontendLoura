"use client";

import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import {  LuCalendarOff, LuPause } from "react-icons/lu";
import {  Badge, Button, Card, Input } from "@/components/ui";


export function EmployeesPagination({
  currentPage,
  totalCount,
  handlePageChange,
  hasPrevious,
  hasNext,
  loading,
}: {
  currentPage: number;
  totalCount: number;
  handlePageChange: (page: number) => void;
  hasPrevious: boolean;
  hasNext: boolean;
  loading: boolean;
}) {
  return (
    <Card className="p-2 border-0 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {currentPage} sur {Math.ceil(totalCount / 20)} • {totalCount} employés
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious || loading}
          >
            <HiOutlineChevronLeft className="size-3 mr-1" />
            <span className="text-xs">Précédent</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || loading}
          >
            <span className="text-xs">Suivant</span>
            <HiOutlineChevronRight className="size-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
