import { HeroVideoSection } from "@/components/landing/sections/hero-video-section";
import { buttonVariants } from "@/components/ui";
import { siteConfig } from "@/lib/landing/config";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

export function HeroSection() {
  const { hero } = siteConfig;

  return (
    <section
      id="hero"
      className="w-full relative overflow-visible"
      style={{ minHeight: "700px" }}
    >
          <BackgroundRippleEffect />
      <div className="relative flex flex-col items-center w-full px-6">
        {/* Fond gradient avec une touche de luminosité */}

        <div className="relative z-20 pt-28 md:pt-40 max-w-5xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center">
          {/* Badge animé pour attirer l'attention */}
          <div className="border border-border bg-background/80 backdrop-blur-md shadow-sm shadow-border/10 rounded-full text-xs h-9 px-5 flex items-center gap-3 text-muted-foreground animate-fade-in-up">
            {hero?.badgeIcon || <Star className="w-4 h-4 text-primary/80" />}
            <span className="font-semibold tracking-wide">{hero?.badge}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-8">
            {/* Titre avec effets et mise en valeur de certains mots */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter text-balance text-center leading-[1.08] animate-fade-in-up">
              <span className="font-display font-black drop-shadow-sm">Gérez</span>
              <span className="text-primary font-display font-black drop-shadow-md"> votre </span>
              <span className="font-display font-black italic underline decoration-primary/50 underline-offset-4">entreprise</span>
              <br className="hidden md:block" />
              <span className="text-muted-foreground"> en toute </span>
              <span className="font-display font-black text-primary">simplicité</span>
            </h1>

            {/* Ligne de sous-titre plus dynamique */}
            <p className="text-lg md:text-xl text-center text-muted-foreground font-medium leading-relaxed max-w-3xl animate-fade-in-up delay-100">
              {hero?.description || "La plateforme tout-en-un pour piloter, collaborer et croître sans limites."}
            </p>
          </div>
          
          {/* CTA: accent et effet léger au hover */}
          <div className="flex items-center gap-4 flex-wrap justify-center pt-2 animate-fade-in-up delay-200">
            <Link
              href={hero?.cta.primary.href ?? "#"}
              className="group inline-flex items-center gap-2 bg-primary/80 dark:bg-primary hover:bg-primary/90 text-foreground font-semibold shadow-lg shadow-primary/10 px-7 py-3.5 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {hero?.cta.primary.text ?? ""}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={hero?.cta.secondary.href ?? ""} 
              className="inline-flex items-center gap-2 bg-background/80 hover:bg-secondary border border-border text-foreground font-semibold px-7 py-3.5 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-border"
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
