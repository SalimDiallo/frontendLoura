"use client";

import { SectionHeader } from "@/components/landing/section-header";
import { siteConfig } from "@/lib/landing/config";

export function GrowthSection() {
  const { title, description, items } = siteConfig.growthSection;

  return (
    <section
      id="growth"
      className="flex flex-col items-center justify-center w-full relative px-5 md:px-10 py-20"
    >
      <div className="border-x border-border mx-5 md:mx-10 relative">
        {/* Decorative borders */}
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-foreground/[0.03] bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-foreground/[0.03] bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]"></div>

        {/* Section Header */}
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance">
            <span className="font-display font-bold">Sécurité</span>
            <span className="text-muted-foreground font-normal"> et </span>
            <span className="font-display font-bold italic">scalabilité</span>
          </h2>
          <p className="text-muted-foreground text-center text-balance font-normal max-w-2xl mx-auto">
            {description}
          </p>
        </SectionHeader>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x md:divide-y-0 divide-border mt-12">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-start justify-end gap-3 p-8 min-h-[450px]"
            >
              {item.content}
              <h3 className="text-lg tracking-tight font-semibold">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
