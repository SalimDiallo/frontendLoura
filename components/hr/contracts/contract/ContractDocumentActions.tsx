"use client";

import { Button, Card } from "@/components/ui";
import type { Contract } from "@/lib/types/hr";
import {
    HiOutlineArrowTopRightOnSquare,
    HiOutlineDocument,
    HiOutlineEye
} from "react-icons/hi2";



export function ContractDocumentActions({
  contract,
  handlePreviewPDF,
  handleDownloadPDF,
}: {
  contract: Contract,
  handlePreviewPDF: () => void,
  handleDownloadPDF: () => void,
}) {
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <HiOutlineDocument className="size-4" />
          DOCUMENT
        </div>
        <div className="flex gap-2">
          {contract.contract_file_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={contract.contract_file_url} target="_blank" rel="noopener noreferrer">
                <HiOutlineArrowTopRightOnSquare className="size-4 mr-2" />
                Voir le document
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePreviewPDF}>
            <HiOutlineEye className="size-4 mr-2" />
            Aperçu PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <HiOutlineDocument className="size-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>
      
      {!contract.contract_file_url && (
        <p className="text-sm text-muted-foreground mt-4">
          Aucun document attaché à ce contrat.
        </p>
      )}
    </Card>
  );
}
