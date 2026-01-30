import { HeroVideoSection } from "@/components/landing/sections/hero-video-section";
import { buttonVariants } from "@/components/ui";
import { siteConfig } from "@/lib/landing/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const { hero } = siteConfig;

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full px-6">
        {/* Fond gradient sobre */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full bg-gradient-to-b from-background via-background to-secondary/30 rounded-b-xl"></div>
        </div>
        
        <div className="relative z-10 pt-32 md:pt-40 max-w-4xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center">
          {/* Badge sobre */}
          <p className="border border-border bg-background rounded-full text-sm h-8 px-4 flex items-center gap-2 text-muted-foreground">
            {hero?.badgeIcon}
            <span className="font-medium">{hero?.badge}</span>
          </p>
          
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Titre avec police audacieuse */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tight text-balance text-center leading-[1.1]">
              <span className="font-display font-bold">Gerer</span>
              <span className="text-primary"> votre </span>
              <span className="font-display font-bold italic">entreprise</span>
              <br className="hidden md:block" />
              <span className="text-muted-foreground"> en toute </span>
              <span className="font-display font-bold">simplicité</span>
            </h1>
            
            {/* Description sobre */}
            <p className="text-base md:text-lg text-center text-muted-foreground font-normal text-balance leading-relaxed max-w-2xl">
              {hero?.description}
            </p>
          </div>
          
          {/* CTAs avec style épuré */}
          <div className="flex items-center gap-4 flex-wrap justify-center pt-4">
            <Link
              href={hero?.cta.primary.href ?? "#"}
              className="group inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-medium px-6 py-3 rounded-full transition-all duration-200"
            >
              {hero?.cta.primary.text ?? ""}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={hero?.cta.secondary.href ?? ""} 
              className="inline-flex items-center gap-2 bg-transparent hover:bg-secondary border border-border text-foreground font-medium px-6 py-3 rounded-full transition-all duration-200"
            >
              {hero?.cta.secondary.text}
            </Link>
          </div>
        </div>
      </div>
      <HeroVideoSection />
    </section>
  );
}
