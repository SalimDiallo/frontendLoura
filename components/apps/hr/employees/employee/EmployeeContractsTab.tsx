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
import { contractService, getPayrolls } from "@/lib/services/hr";
import type { Employee, Contract, Payroll } from "@/lib/types/hr";
import {
  HiOutlinePencil,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineCog,
} from "react-icons/hi2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Can } from "@/components/apps/common";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";

// === Composants indépendants ===



export function EmployeeContractsTab({
  contracts,
  slug,
  id,
  loadingContracts,
  loadContracts,
}: {
  contracts: Contract[];
  slug: string;
  id: string;
  loadingContracts: boolean;
  loadContracts: () => Promise<void>;
}) {
  // Les labels et couleurs sont hors de la map pour éviter des recalculate
  const contractTypeLabels: Record<string, string> = {
    permanent: "CDI",
    temporary: "CDD",
    contract: "Contractuel",
    internship: "Stage",
    freelance: "Freelance",
  };
  const contractTypeColors: Record<string, string> = {
    permanent: "bg-green-100 text-green-800 border-green-200",
    temporary: "bg-blue-100 text-blue-800 border-blue-200",
    contract: "bg-purple-100 text-purple-800 border-purple-200",
    internship: "bg-orange-100 text-orange-800 border-orange-200",
    freelance: "bg-pink-100 text-pink-800 border-pink-200",
  };

  return (
    <TabsContent value="contracts" className="space-y-4">
      {/* Add/Title */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contrats de l'employé</h3>
          <p className="text-sm text-muted-foreground">
            Un employé ne peut avoir qu'un seul contrat actif à la fois
          </p>
        </div>
        <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
          <Button asChild size="sm">
            <Link href={`/apps/${slug}/hr/contracts/create?employee=${id}`}>
              <HiOutlinePlusCircle className="size-4 mr-2" />
              Nouveau contrat
            </Link>
          </Button>
        </Can>
      </div>
      {/* Active Contract Summary */}
      {contracts.filter(c => c.is_active).length > 0 && (
        <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <HiOutlineCheckCircle className="size-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                Contrat actif
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {(() => {
                  const activeContract = contracts.find(c => c.is_active);
                  if (!activeContract) return null;
                  return `${contractTypeLabels[activeContract.contract_type] || activeContract.contract_type} - ${activeContract.base_salary?.toLocaleString('fr-FR')} ${activeContract.currency}/mois`;
                })()}
              </div>
            </div>
            <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
              <Button variant="outline" size="sm" asChild className="border-green-300 text-green-700 hover:bg-green-100">
                <Link href={`/apps/${slug}/hr/contracts/${contracts.find(c => c.is_active)?.id}`}>
                  Voir le contrat
                </Link>
              </Button>
            </Can>
          </div>
        </Card>
      )}
      {/* Content */}
      {loadingContracts ? (
        <Card className="p-8 border-0 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </Card>
      ) : contracts.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <HiOutlineDocumentText className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Aucun contrat</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cet employé n'a pas encore de contrat enregistré
              </p>
            </div>
            <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
              <Button asChild>
                <Link href={`/apps/${slug}/hr/contracts/create?employee=${id}`}>
                  <HiOutlinePlusCircle className="size-4 mr-2" />
                  Créer un contrat
                </Link>
              </Button>
            </Can>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...contracts]
            .sort((a, b) => {
              if (a.is_active && !b.is_active) return -1;
              if (!a.is_active && b.is_active) return 1;
              return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
            })
            .map((contract) => {
              const isActive = contract.is_active;
              const isExpired = contract.is_expired || (contract.end_date && new Date(contract.end_date) < new Date());
              return (
                <Card 
                  key={contract.id} 
                  className={`p-6 border-0 shadow-sm transition-colors ${
                    isActive 
                      ? 'ring-2 ring-green-500 ring-offset-2 bg-green-50/50 dark:bg-green-950/10' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className={contractTypeColors[contract.contract_type] || ""}>
                          {contractTypeLabels[contract.contract_type] || contract.contract_type}
                        </Badge>
                        {isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <HiOutlineCheckCircle className="size-3 mr-1" />
                            Contrat actif
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <HiOutlineXCircle className="size-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Expiré
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Période</div>
                          <div className="text-sm font-medium">
                            {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                            {contract.end_date ? (
                              <> → {new Date(contract.end_date).toLocaleDateString('fr-FR')}</>
                            ) : (
                              <span className="text-muted-foreground ml-1">(indéterminée)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Salaire de base</div>
                          <div className="text-sm font-medium">
                            {contract.base_salary?.toLocaleString('fr-FR')} {contract.currency}
                            <span className="text-muted-foreground ml-1">
                              /{contract.salary_period === 'monthly' ? 'mois' : contract.salary_period === 'hourly' ? 'h' : contract.salary_period === 'annual' ? 'an' : 'jour'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Heures/semaine</div>
                          <div className="text-sm font-medium">
                            {contract.hours_per_week || '-'}h
                          </div>
                        </div>
                      </div>
                      {contract.description && (
                        <div>
                          <div className="text-sm text-muted-foreground">Description</div>
                          <div className="text-sm mt-1">{contract.description}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-col sm:flex-row">
                      <Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
                        {!isActive && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={async () => {
                              const confirmMessage = `Activer ce contrat ?\n\nLes autres contrats actifs seront automatiquement désactivés.`;
                              if (!confirm(confirmMessage)) return;
                              try {
                                await contractService.activateContract(slug, contract.id);
                                await loadContracts();
                              } catch (err) {
                                console.error(err);
                                alert("Erreur lors de l'activation");
                              }
                            }}
                          >
                            <HiOutlineCheckCircle className="size-4 mr-1" />
                            Activer
                          </Button>
                        )}
                        {isActive && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={async () => {
                              if (!confirm("Désactiver ce contrat ?")) return;
                              try {
                                await contractService.deactivateContract(slug, contract.id);
                                await loadContracts();
                              } catch (err) {
                                console.error(err);
                                alert("Erreur lors de la désactivation");
                              }
                            }}
                          >
                            <HiOutlineXCircle className="size-4 mr-1" />
                            Désactiver
                          </Button>
                        )}
                      </Can>
                      <Can permission={COMMON_PERMISSIONS.HR.VIEW_CONTRACTS}>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/apps/${slug}/hr/contracts/${contract.id}`}>
                            <HiOutlineEye className="size-4 mr-1" />
                            Voir
                          </Link>
                        </Button>
                      </Can>
                      <Can permission={COMMON_PERMISSIONS.HR.UPDATE_CONTRACTS}>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/apps/${slug}/hr/contracts/${contract.id}/edit`}>
                            <HiOutlinePencil className="size-4 mr-1" />
                            Modifier
                          </Link>
                        </Button>
                      </Can>
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
