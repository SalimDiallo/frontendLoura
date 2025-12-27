"use client";

import * as React from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <HiOutlineSun className="size-5" />
      </Button>
    );
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
    >
      {isDark ? (
        <HiOutlineSun className="size-5" />
      ) : (
        <HiOutlineMoon className="size-5" />
      )}
    </Button>
  );
}
