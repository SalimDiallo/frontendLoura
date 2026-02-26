"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  Alert,
  Badge
} from "@/components/ui";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import {
  HiOutlineBanknotes,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineCog,
} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



export function EmployeePayrollTab({
  payslips,
  loadingPayslips,
  slug,
  id
}: {
  payslips: Payroll[];
  loadingPayslips: boolean;
  slug: string;
  id: string;
}) {
  return (
    <TabsContent value="payroll" className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Fiches de paie</h3>
          <p className="text-sm text-muted-foreground">
            Historique des fiches de paie de l'employé
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/apps/${slug}/hr/payroll/create?employee=${id}`}>
            <HiOutlinePlusCircle className="size-4 mr-2" />
            Nouvelle fiche
          </Link>
        </Button>
      </div>

      {loadingPayslips ? (
        <Card className="p-8 border-0 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </Card>
      ) : payslips.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <HiOutlineBanknotes className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Aucune fiche de paie</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cet employé n'a pas encore de fiche de paie
              </p>
            </div>
            <Button asChild>
              <Link href={`/apps/${slug}/hr/payroll/create?employee=${id}`}>
                <HiOutlinePlusCircle className="size-4 mr-2" />
                Créer une fiche de paie
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {payslips.map((payslip) => {
            const statusConfig: Record<string, { label: string; className: string }> = {
              draft: { label: "Brouillon", className: "bg-gray-100 text-gray-800" },
              pending: { label: "En attente", className: "bg-amber-100 text-amber-800" },
              paid: { label: "Payé", className: "bg-green-100 text-green-800" },
              cancelled: { label: "Annulé", className: "bg-red-100 text-red-800" },
            };
            const config = statusConfig[payslip.status] || { label: payslip.status, className: "" };

            return (
              <Card key={payslip.id} className="p-4 border-0 shadow-sm hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{payslip.payroll_period_name}</span>
                      <Badge className={config.className}>{config.label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Salaire net: <span className="font-semibold text-green-600">{payslip.net_salary?.toLocaleString('fr-FR')} GNF</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/apps/${slug}/hr/payroll/${payslip.id}`}>
                        <HiOutlineEye className="size-4 mr-1" />
                        Détails
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </TabsContent>
  );
}
