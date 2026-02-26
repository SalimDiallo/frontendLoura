'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Alert, Badge, Input } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDepartment, deleteDepartment, activateDepartment, deactivateDepartment } from '@/lib/services/hr/department.service';
import { getEmployees, patchEmployee } from '@/lib/services/hr/employee.service';
import type { Department, EmployeeListItem } from '@/lib/types/hr';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCog,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { ReactNode, SetStateAction, Dispatch } from 'react';
import { Can } from '@/components/apps/common';
import { COMMON_PERMISSIONS } from '@/lib/types/permissions';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { EmployeeModaleSection } from './EmployeeModaleSection';





type ManageEmployeeModalProps = {
    show: boolean;
    onClose: () => void;
    employeesInDepartment: EmployeeListItem[];
    employeesNotInDepartment: EmployeeListItem[];
    loadingAllEmployees: boolean;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    handleAddEmployee: (id: string) => Promise<void> | void;
    handleRemoveEmployee: (id: string) => Promise<void> | void;
    updatingEmployee: string | null;
    modalError: string | null;
    setModalError: Dispatch<SetStateAction<string | null>>;
    departmentName?: string;
  };
  
  export function ManageEmployeeModal({
    show,
    onClose,
    employeesInDepartment,
    employeesNotInDepartment,
    loadingAllEmployees,
    searchQuery,
    setSearchQuery,
    handleAddEmployee,
    handleRemoveEmployee,
    updatingEmployee,
    modalError,
    setModalError,
    departmentName,
  }: ManageEmployeeModalProps) {
    return !show ? null : (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-xl font-semibold">Gérer les employés</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Département: {departmentName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <HiOutlineXMark className="size-5" />
            </button>
          </div>
          <div className="p-4 border-b">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          {modalError && (
            <div className="px-4 pt-4">
              <Alert variant="error" onClose={() => setModalError(null)}>
                {modalError}
              </Alert>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loadingAllEmployees ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                <p className="mt-2 text-sm text-muted-foreground">Chargement des employés...</p>
              </div>
            ) : (
              <>
                <EmployeeModaleSection
                  title="Dans ce département"
                  icon={<HiOutlineUsers className="size-4" />}
                  employees={employeesInDepartment}
                  onAction={handleRemoveEmployee}
                  updatingEmployee={updatingEmployee}
                  actionLabel="Retirer"
                  actionColor="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                  actionIcon={<MinusCircle className="w-40 h-40" />}
                  isRemove
                />
                <EmployeeModaleSection
                  title="Employés disponibles"
                  icon={<HiOutlineUserGroup className="size-4" />}
                  employees={employeesNotInDepartment}
                  onAction={handleAddEmployee}
                  updatingEmployee={updatingEmployee}
                  actionLabel="Ajouter"
                  actionColor="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                  actionIcon={<PlusCircle className="w-40 h-40" />}
                  isRemove={false}
                />
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }
  