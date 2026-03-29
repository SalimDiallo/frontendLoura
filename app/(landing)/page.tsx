"use client";

import { CTASection } from "@/components/landing/sections/cta-section";
import { FAQSection } from "@/components/landing/sections/faq-section";
import { FooterSection } from "@/components/landing/sections/footer-section";
import { HeroSection } from "@/components/landing/sections/hero-section";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
      <HeroSection />
      {/* <CompanyShowcase /> */}
      {/* <BentoSection /> */}
      {/* <QuoteSection /> */}
      {/* <FeatureSection /> */}
      {/* <GrowthSection /> */}
      {/* <PricingSection /> */}
      {/* <TestimonialSection /> */}
      <FAQSection />
      <CTASection /> 
      <FooterSection />
    </main>
  );
}
