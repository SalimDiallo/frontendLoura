"use client";

import { Can } from "@/components/apps/common";
import { Button } from "@/components/ui";
import { ShortcutBadge } from "@/components/ui/shortcuts-help";
import { KeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcuts";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";
import Link from "next/link";
import {
    HiOutlineDocumentText,
    HiOutlinePlusCircle,
    HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";




// Composant : Header
export function ContractsHeader({ slug, onShowShortcuts, shortcuts }: { slug: string, onShowShortcuts: () => void, shortcuts: KeyboardShortcut[] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HiOutlineDocumentText className="size-7" />
          Contrats
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez tous les contrats de vos employés
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowShortcuts}
          aria-label="Afficher les raccourcis clavier"
          title="Raccourcis clavier (?)"
        >
          <HiOutlineQuestionMarkCircle className="size-4" />
        </Button>
        <Can permission={COMMON_PERMISSIONS.HR.CREATE_CONTRACTS}>
          <Button asChild>
            <Link href={`/apps/${slug}/hr/contracts/create`}>
              <HiOutlinePlusCircle className="size-4 mr-2" />
              Nouveau contrat
              <ShortcutBadge shortcut={shortcuts.find(s => s.key === "n")!} />
            </Link>
          </Button>
        </Can>
      </div>
    </div>
  );
}
