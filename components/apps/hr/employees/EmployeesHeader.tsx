"use client";

import { Button } from "@/components/ui";
import Link from "next/link";
import {
  HiOutlinePaperAirplane,
  HiOutlinePlusCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineUserCircle
} from "react-icons/hi2";

import { Can } from "@/components/apps/common";
import { ShortcutBadge } from "@/components/ui/shortcuts-help";
import { KeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcuts";
import { COMMON_PERMISSIONS } from "@/lib/types/permissions";


export function EmployeesHeader({ slug, shortcuts, showShortcuts, setShowShortcuts }: {
  slug: string;
  shortcuts: KeyboardShortcut[];
  showShortcuts: boolean;
  setShowShortcuts: (open: boolean) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
          <HiOutlineUserCircle className="size-7" />
          Employés
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Gérez tous vos employés et leurs informations
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShortcuts(true)}
          aria-label="Afficher les raccourcis clavier"
          title="Raccourcis clavier (?)"
          className="h-9 px-3"
        >
          <HiOutlineQuestionMarkCircle className="size-4" />
        </Button>
        <Can permission={COMMON_PERMISSIONS.HR.CREATE_EMPLOYEES}>
          <Button asChild variant="outline" size="sm" className="h-9 px-3">
            <Link href={`/apps/${slug}/hr/employees/invitations`}>
              <span className="text-sm">Invitations</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 px-3">
            <Link href={`/apps/${slug}/hr/employees/invite`}>
              <HiOutlinePaperAirplane className="size-4 mr-1.5" />
              <span className="text-sm">Inviter</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9 px-3">
            <Link href={`/apps/${slug}/hr/employees/create`}>
              <HiOutlinePlusCircle className="size-4 mr-1.5" />
              <span className="text-sm">Nouvel employé</span>
              <ShortcutBadge shortcut={shortcuts.find((s) => s.key === "n")!} />
            </Link>
          </Button>
        </Can>
      </div>
    </div>
  );
}

