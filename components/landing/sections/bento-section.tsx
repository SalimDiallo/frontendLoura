"use client";

import { SectionHeader } from "@/components/landing/section-header";
import { siteConfig } from "@/lib/landing/config";

export function BentoSection() {
  const { title, description, items } = siteConfig.bentoSection;

  return (
    <section
      id="bento"
      className="flex flex-col items-center justify-center w-full relative px-5 md:px-10 py-20"
    >
      <div className="border-x border-border mx-5 md:mx-10 relative">
        {/* Decorative patterns */}
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-primary/[0.03] bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-primary/[0.03] bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>

        <SectionHeader>
          <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance pb-2">
            <span className="font-display font-bold">Accélérez</span>
            <span className="text-muted-foreground font-normal"> la gestion avec </span>
            <span className="font-display font-bold italic">l'IA</span>
          </h2>
          <p className="text-muted-foreground text-center text-balance font-normal max-w-2xl mx-auto">
            {description}
          </p>
        </SectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden mt-12">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-start justify-end min-h-[500px] md:min-h-[450px] p-0.5 relative before:absolute before:-left-0.5 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-0.5 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] group cursor-pointer max-h-[450px]"
            >
              <div className="relative flex size-full items-center justify-center h-full overflow-hidden">
                {item.content}
              </div>
              <div className="flex-1 flex-col gap-2 p-6 pb-8">
                <h3 className="text-lg tracking-tight font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
