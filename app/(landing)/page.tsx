"use client";

import { BentoSection } from "@/components/landing/sections/bento-section";
import { CompanyShowcase } from "@/components/landing/sections/company-showcase";
import { CTASection } from "@/components/landing/sections/cta-section";
import { FAQSection } from "@/components/landing/sections/faq-section";
import { FeatureSection } from "@/components/landing/sections/feature-section";
import { FeaturesSectionDemo } from "@/components/landing/sections/feature-sections";
import { FooterSection } from "@/components/landing/sections/footer-section";
import { GrowthSection } from "@/components/landing/sections/growth-section";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { PricingSection } from "@/components/landing/sections/pricing-section";
import { QuoteSection } from "@/components/landing/sections/quote-section";
import { TestimonialSection } from "@/components/landing/sections/testimonial-section";
import { ThreeDMarqueeDemoSecond } from "@/components/landing/sections/tools-section";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
      <HeroSection />
      <CompanyShowcase />
      <BentoSection />
      <QuoteSection />
      <FeatureSection />
      <GrowthSection />
      <PricingSection />
      <TestimonialSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
