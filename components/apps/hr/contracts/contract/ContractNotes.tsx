"use client";

import { Card } from "@/components/ui";
import {
    HiOutlineDocumentText
} from "react-icons/hi2";


export function ContractNotes({ description }: { description: string | null | undefined }) {
  if (!description) return null;
  return (
    <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <HiOutlineDocumentText className="size-4" />
        NOTES
      </div>
      <p className="text-sm whitespace-pre-wrap">{description}</p>
    </Card>
  );
}

