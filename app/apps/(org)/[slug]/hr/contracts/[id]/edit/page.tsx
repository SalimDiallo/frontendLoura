"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import { Button, Card, Alert } from "@/components/ui";
import { ContractForm } from "@/components/hr/contract-form";
import { contractService } from "@/lib/services/hr";
import type { Contract } from "@/lib/types/hr";
import { ProtectedRoute } from "@/components/apps/common";
import { HR_ROUTE_PERMISSIONS } from "@/lib/config/route-permissions";

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const id = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContract(slug, id);
      setContract(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement du contrat";
      setError(errorMessage);
      console.error('Error loading contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedContract: Contract) => {
    router.push(`/apps/${slug}/hr/contracts/${updatedContract.id}`);
  };

  const handleCancel = () => {
    router.push(`/apps/${slug}/hr/contracts/${id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-6">
        <Alert variant="error">{error || "Contrat non trouvé"}</Alert>
        <Button asChild>
          <Link href={`/apps/${slug}/hr/contracts`}>
            <HiOutlineArrowLeft className="size-4 mr-2" />
            Retour à la liste
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ProtectedRoute config={HR_ROUTE_PERMISSIONS['/hr/contracts/:id/edit']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${slug}/hr/contracts/${id}`}>
                <HiOutlineArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <HiOutlineDocumentText className="size-7" />
                Modifier le contrat
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {contract.employee_name}
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 border-0 shadow-sm">
          <ContractForm
            orgSlug={slug}
            contract={contract}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
