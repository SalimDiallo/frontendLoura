import { Highlighter } from "@/components/ui/highlighter";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

export function QuoteSection() {
  return (
    <section
      id="quote"
      className="relative flex flex-col items-center justify-center w-full py-16 px-4 bg-background overflow-hidden"
    >
      {/* Decorative animated background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <BackgroundRippleEffect rows={8} cols={27} cellSize={32} />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-medium text-muted-foreground mb-3">
          Notre vision
        </h3>
        <blockquote className="mb-6">
          <p className="text-xl leading-relaxed text-foreground whitespace-pre-line italic">
            <Highlighter action="underline" color="#7dc4fa">
              LouraTech
            </Highlighter>
            {" "}rend la gestion moderne accessible à tous{" "}
            <Highlighter action="highlight" color="#ffd1dc">
              simplicité
            </Highlighter>
            {" "}et innovation pour votre{" "}
            <Highlighter action="box" color="#f5c452">
              réussite.
            </Highlighter>
          </p>
        </blockquote>
        <footer className="flex flex-col items-center gap-2">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzHKNvHY5QA-EucL4ub5i8IfODcaSigz6klQ&s"
            alt="Sidy Mohamed Salim Diallo"
            width={48}
            height={48}
            className="rounded-full object-cover bg-white mb-1 border border-border shadow-sm"
          />
          <div className="text-center">
            <p className="font-semibold text-base text-foreground">
              Sidy Mohamed Salim Diallo
            </p>
            <p className="text-sm text-muted-foreground">CEO & Fondateur, LouraTech</p>
          </div>
        </footer>
      </div>
    </section>
  );
}
