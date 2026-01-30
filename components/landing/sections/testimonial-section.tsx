import { SectionHeader } from "@/components/landing/section-header";
import { SocialProofTestimonials } from "@/components/landing/testimonial-scroll";
import { siteConfig } from "@/lib/landing/config";

export function TestimonialSection() {
  const { testimonials } = siteConfig;

  return (
    <section
      id="testimonials"
      className="flex flex-col items-center justify-center w-full py-20"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance">
          <span className="text-muted-foreground font-normal">Ce que disent </span>
          <span className="font-display font-bold italic">nos clients</span>
        </h2>
        <p className="text-muted-foreground text-center text-balance font-normal max-w-2xl mx-auto">
          Découvrez comment nos clients optimisent leur gestion quotidienne avec LouraTech.
        </p>
      </SectionHeader>
      <SocialProofTestimonials testimonials={testimonials} />
    </section>
  );
}
