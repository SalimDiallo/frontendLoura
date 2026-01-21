import { SectionHeader } from "@/components/landing/section-header";
import { Feature as FeatureComponent } from "@/components/landing/ui/feature-slideshow";
import { siteConfig } from "@/lib/landing/config";

export function FeatureSection() {
  const featureSection= siteConfig?.featureSection;

  return (
    <section
      id="features"
      className="flex flex-col items-center justify-center gap-5 w-full relative"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          {featureSection?.title}
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          {featureSection?.description}
        </p>
      </SectionHeader>
      <div className="w-full h-full lg:h-[450px] flex items-center justify-center">
        <FeatureComponent
          collapseDelay={5000}
          linePosition="bottom"
          featureItems={featureSection?.items}
          lineColor="bg-secondary"
        />
      </div>
    </section>
  );
}
