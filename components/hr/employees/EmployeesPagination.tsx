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
    <Card className="p-4 border shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} sur {Math.ceil(totalCount / 20)} • {totalCount} employés
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious || loading}
          >
            <HiOutlineChevronLeft className="size-4 mr-1.5" />
            <span className="text-sm">Précédent</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || loading}
          >
            <span className="text-sm">Suivant</span>
            <HiOutlineChevronRight className="size-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
