"use client";

import { Button, Card } from "@/components/ui";
import { Keyboard, X } from "lucide-react";
import { KeyboardShortcut, formatShortcut } from "@/lib/hooks/use-keyboard-shortcuts";

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  title?: string;
}

/**
 * Modal d'aide pour afficher les raccourcis clavier
 */
export function ShortcutsHelpModal({
  isOpen,
  onClose,
  shortcuts,
  title = "Raccourcis clavier",
}: ShortcutsHelpModalProps) {
  if (!isOpen) return null;

  // Grouper les raccourcis par catégorie basée sur la description
  const groupedShortcuts = shortcuts
    .filter((s) => s.description)
    .reduce((acc, shortcut) => {
      let category = "Autres";
      const desc = shortcut.description?.toLowerCase() || "";
      
      if (desc.includes("recherche") || desc.includes("search") || (shortcut.ctrl && shortcut.key === "k")) {
        category = "Recherche";
      } else if (desc.includes("nouveau") || desc.includes("créer") || desc.includes("ajouter") || shortcut.key === "n") {
        category = "Création";
      } else if (desc.includes("éditer") || desc.includes("modifier") || shortcut.key === "e") {
        category = "Édition";
      } else if (desc.includes("navigation") || shortcut.key === "ArrowUp" || shortcut.key === "ArrowDown" || shortcut.key === "Enter") {
        category = "Navigation";
      } else if (desc.includes("filtre") || desc.includes("filter") || /^[1-9]$/.test(shortcut.key)) {
        category = "Filtres";
      } else if (desc.includes("page") || shortcut.key === "," || shortcut.key === ".") {
        category = "Pagination";
      } else if (desc.includes("aide") || desc.includes("help") || shortcut.key === "?") {
        category = "Aide";
      } else if (desc.includes("activer") || desc.includes("désactiver") || desc.includes("supprimer")) {
        category = "Actions";
      }

      if (!acc[category]) acc[category] = [];
      acc[category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

  // Ordre des catégories
  const categoryOrder = ["Navigation", "Recherche", "Filtres", "Création", "Édition", "Actions", "Pagination", "Aide", "Autres"];
  const sortedCategories = Object.keys(groupedShortcuts).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
    >
      <Card
        className="w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="shortcuts-help-title"
            className="text-xl font-bold flex items-center gap-2"
          >
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {sortedCategories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <span className="h-px flex-1 bg-border"></span>
                {category}
                <span className="h-px flex-1 bg-border"></span>
              </h3>
              <div className="space-y-2">
                {groupedShortcuts[category].map((shortcut, index) => (
                  <ShortcutItem key={index} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Appuyez sur <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Esc</kbd> pour fermer
          </p>
          <p className="text-xs text-muted-foreground">
            {shortcuts.filter(s => s.description).length} raccourcis disponibles
          </p>
        </div>
      </Card>
    </div>
  );
}

interface ShortcutItemProps {
  shortcut: KeyboardShortcut;
}

function ShortcutItem({ shortcut }: ShortcutItemProps) {
  const keys = formatShortcut(shortcut);

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{shortcut.description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 rounded border bg-muted font-mono text-xs min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

interface ShortcutBadgeProps {
  shortcut: KeyboardShortcut;
  className?: string;
}

/**
 * Badge inline pour afficher un raccourci à côté d'un bouton
 */
export function ShortcutBadge({ shortcut, className = "" }: ShortcutBadgeProps) {
  const keys = formatShortcut(shortcut);

  return (
    <span className={`hidden sm:inline-flex items-center gap-0.5 ml-2 ${className}`}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="h-5 px-1.5 rounded border bg-muted/50 font-mono text-xs flex items-center justify-center"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

interface KeyboardHintProps {
  className?: string;
}

/**
 * Texte indicatif pour les raccourcis clavier en bas de page
 */
export function KeyboardHint({ className = "" }: KeyboardHintProps) {
  return (
    <p className={`text-center text-xs text-muted-foreground ${className}`}>
      Appuyez sur{" "}
      <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">?</kbd>{" "}
      pour voir tous les raccourcis clavier
    </p>
  );
}
