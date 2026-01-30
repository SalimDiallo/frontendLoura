import Image from "next/image";
import { siteConfig } from "@/lib/landing/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const { ctaSection } = siteConfig;

  return (
    <section
      id="cta"
      className="flex flex-col items-center justify-center w-full py-20 px-6"
    >
      <div className="w-full max-w-6xl mx-auto">
        <div className="h-[450px] md:h-[400px] overflow-hidden w-full rounded-3xl bg-foreground relative z-20">
          {ctaSection?.backgroundImage && (
            <Image
              src={ctaSection.backgroundImage}
              alt="Agent CTA Background"
              className="absolute inset-0 w-full h-full object-cover object-right md:object-center opacity-30"
              fill
              priority
            />
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/80 to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <h2 className="text-background text-3xl md:text-5xl lg:text-6xl tracking-tight max-w-2xl text-center leading-[1.1] mb-6">
              <span className="font-display font-bold">Prêt</span>
              <span className="font-light"> à transformer </span>
              <br className="hidden md:block" />
              <span className="font-display font-bold italic">votre gestion</span>
              <span className="font-light"> ?</span>
            </h2>
            
            <p className="text-background/70 text-center max-w-md mb-8 text-sm md:text-base">
              {ctaSection?.subtext}
            </p>
            
            <Link
              href={ctaSection?.button?.href ?? "#"}
              className="group inline-flex items-center gap-2 bg-background hover:bg-background/90 text-foreground font-medium text-sm px-6 py-3 rounded-full transition-all duration-200"
            >
              {ctaSection?.button.text}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
