"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { Search, Plus, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickSelectItem {
  id: string;
  name: string;
  subtitle?: string;
}

interface QuickSelectProps {
  label: string;
  items: QuickSelectItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate?: (name: string, extra?: string) => Promise<QuickSelectItem | void>;
  placeholder?: string;
  icon?: React.ElementType;
  accentColor?: "green" | "blue" | "orange" | "purple" | "primary";
  createLabel?: string;
  extraFieldLabel?: string;
  disabled?: boolean;
  required?: boolean;
}

const colorClasses = {
  green: {
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50/50 dark:bg-green-900/20",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    iconText: "text-green-600",
    text: "text-green-700 dark:text-green-400",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/50 dark:bg-blue-900/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconText: "text-blue-600",
    text: "text-blue-700 dark:text-blue-400",
  },
  orange: {
    border: "border-orange-200 dark:border-orange-800",
    bg: "bg-orange-50/50 dark:bg-orange-900/20",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
    iconText: "text-orange-600",
    text: "text-orange-700 dark:text-orange-400",
  },
  purple: {
    border: "border-purple-200 dark:border-purple-800",
    bg: "bg-purple-50/50 dark:bg-purple-900/20",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconText: "text-purple-600",
    text: "text-purple-700 dark:text-purple-400",
  },
  primary: {
    border: "border-primary/20",
    bg: "bg-primary/5",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    text: "text-primary",
  },
};

export function QuickSelect({
  label,
  items,
  selectedId,
  onSelect,
  onCreate,
  placeholder = "Rechercher...",
  icon: Icon,
  accentColor = "primary",
  createLabel = "Créer",
  extraFieldLabel,
  disabled = false,
  required = false,
}: QuickSelectProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExtra, setNewExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = colorClasses[accentColor];
  const selectedItem = items.find(i => i.id === selectedId);
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.subtitle && i.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      if (onCreate) {
        const result = await onCreate(newName.trim(), newExtra.trim() || undefined);
        if (result) {
          onSelect(result.id);
        }
      }
      setCreating(false);
      setIsOpen(false);
      setNewName("");
      setNewExtra("");
      setSearch("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected display */}
      {selectedItem ? (
        <div className={cn("flex items-center justify-between p-3 rounded-lg border", colors.border, colors.bg)}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.iconBg)}>
                <Icon className={cn("h-5 w-5", colors.iconText)} />
              </div>
            )}
            <div>
              <p className="font-medium">{selectedItem.name}</p>
              {selectedItem.subtitle && <p className="text-xs text-muted-foreground">{selectedItem.subtitle}</p>}
            </div>
          </div>
          {!disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onSelect("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className={cn("pl-10", onCreate && "pr-20")}
            disabled={disabled}
          />
          {onCreate && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
              onClick={() => { setCreating(true); setIsOpen(false); setNewName(search); }}
            >
              <Plus className="h-3 w-3 mr-1" />
              {createLabel}
            </Button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedItem && !creating && (
        <div className="border rounded-lg shadow-lg bg-background max-h-48 overflow-y-auto z-50 relative">
          {filtered.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm mb-2">Aucun résultat</p>
              {onCreate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setCreating(true); setNewName(search); setIsOpen(false); }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {createLabel} {search && `"${search}"`}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.id); setIsOpen(false); setSearch(""); }}
                  className="w-full p-3 text-left hover:bg-muted/50 flex items-center gap-3"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                  </div>
                </button>
              ))}
              {filtered.length > 8 && (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  +{filtered.length - 8} autres
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick create form */}
      {creating && onCreate && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {createLabel}
            </h4>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3">
            <Input
              placeholder="Nom *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            {extraFieldLabel && (
              <Input
                placeholder={extraFieldLabel}
                value={newExtra}
                onChange={(e) => setNewExtra(e.target.value)}
              />
            )}
          </div>
          <Button
            type="button"
            disabled={!newName.trim() || saving}
            onClick={handleCreate}
            className="w-full"
            size="sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Créer et sélectionner
          </Button>
        </div>
      )}
    </div>
  );
}

export default QuickSelect;
