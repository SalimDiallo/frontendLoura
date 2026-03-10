import * as React from "react";

interface EtiquetteProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Etiquette component: visually styled "label" with improved angles and modern look.
 * Appearance: Steeper inclination (-18deg), modern blue, increased vertical padding, soft shadow, improved clipping.
 * Usable for marking status (e.g., Vente à crédit) on detail cards.
 */
export default function Etiquette({ children, className = "", style }: EtiquetteProps) {
  return (
    <div
      className={
        [
          "-rotate-[18deg] bg-blue-600 text-white px-3 py-1.5 text-xs font-bold shadow-xl select-none z-20 tracking-wide drop-shadow-sm",
          className
        ].join(" ")
      }
      style={{
        clipPath: "polygon(7% 0%,93% 0%,100% 85%,0% 100%)",
        letterSpacing: "0.06em",
        ...style,
      }}
      aria-label="Etiquette"
    >
      {children}
    </div>
  );
}