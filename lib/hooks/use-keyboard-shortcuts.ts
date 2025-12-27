"use client";

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  /** La touche (ex: 'n', 'Enter', 'ArrowDown') */
  key: string;
  /** Modificateurs optionnels */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Action à exécuter */
  action: () => void;
  /** Description pour l'aide (affichage) */
  description?: string;
  /** Si true, fonctionne même quand un input est focalisé */
  allowInInput?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  /** Liste des raccourcis */
  shortcuts: KeyboardShortcut[];
  /** Si true, désactive tous les raccourcis */
  disabled?: boolean;
}

/**
 * Hook générique pour gérer les raccourcis clavier
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'n', action: () => router.push('/new'), description: 'Nouveau' },
 *     { key: 'k', ctrl: true, action: () => focusSearch(), description: 'Rechercher' },
 *     { key: 'Escape', action: () => setOpen(false), allowInInput: true },
 *   ]
 * });
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  disabled = false,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  
  // Mettre à jour la ref à chaque changement
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        // Vérifier si on doit ignorer car on est dans un input
        if (isInputFocused && !shortcut.allowInInput) {
          // Exception pour Escape qui fonctionne toujours
          if (shortcut.key !== "Escape") continue;
        }

        // Vérifier les modificateurs
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        // Vérifier la touche (insensible à la casse pour les lettres)
        const keyMatch =
          e.key.toLowerCase() === shortcut.key.toLowerCase() ||
          e.key === shortcut.key;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [disabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current,
  };
}

/**
 * Formatte un raccourci pour l'affichage
 */
export function formatShortcut(shortcut: KeyboardShortcut): string[] {
  const keys: string[] = [];
  if (shortcut.ctrl) keys.push("Ctrl");
  if (shortcut.shift) keys.push("Shift");
  if (shortcut.alt) keys.push("Alt");
  
  // Formatter la touche
  const keyDisplay = shortcut.key.length === 1 
    ? shortcut.key.toUpperCase() 
    : shortcut.key === "ArrowUp" ? "↑"
    : shortcut.key === "ArrowDown" ? "↓"
    : shortcut.key === "ArrowLeft" ? "←"
    : shortcut.key === "ArrowRight" ? "→"
    : shortcut.key === "Escape" ? "Esc"
    : shortcut.key === "Enter" ? "Enter"
    : shortcut.key;
    
  keys.push(keyDisplay);
  return keys;
}

/**
 * Raccourcis pré-définis réutilisables
 */
export const commonShortcuts = {
  search: (action: () => void): KeyboardShortcut => ({
    key: "k",
    ctrl: true,
    action,
    description: "Rechercher",
  }),
  
  new: (action: () => void): KeyboardShortcut => ({
    key: "n",
    action,
    description: "Nouveau",
  }),
  
  escape: (action: () => void): KeyboardShortcut => ({
    key: "Escape",
    action,
    description: "Fermer / Annuler",
    allowInInput: true,
  }),
  
  enter: (action: () => void): KeyboardShortcut => ({
    key: "Enter",
    action,
    description: "Confirmer / Ouvrir",
  }),
  
  arrowUp: (action: () => void): KeyboardShortcut => ({
    key: "ArrowUp",
    action,
    description: "Précédent",
  }),
  
  arrowDown: (action: () => void): KeyboardShortcut => ({
    key: "ArrowDown",
    action,
    description: "Suivant",
  }),
  
  help: (action: () => void): KeyboardShortcut => ({
    key: "?",
    action,
    description: "Afficher l'aide",
  }),
  
  filter: (key: string, action: () => void, description: string): KeyboardShortcut => ({
    key,
    action,
    description,
  }),
};
