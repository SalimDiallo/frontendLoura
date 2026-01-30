import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/landing/ui/accordion";
import { SectionHeader } from "@/components/landing/section-header";
import { siteConfig } from "@/lib/landing/config";

export function FAQSection() {
  const { faqSection } = siteConfig;

  return (
    <section
      id="faq"
      className="flex flex-col items-center justify-center gap-10 py-20 w-full relative px-6"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance">
          <span className="font-display font-bold">Questions</span>
          <span className="text-muted-foreground font-normal"> fréquentes</span>
        </h2>
        <p className="text-muted-foreground text-center text-balance font-normal max-w-2xl mx-auto">
          {faqSection?.description}
        </p>
      </SectionHeader>

      <div className="max-w-2xl w-full mx-auto">
        <Accordion
          type="single"
          collapsible
          className="w-full border-0 grid gap-3"
        >
          {faqSection?.faQitems.map((faq, index) => (
            <AccordionItem
              key={index}
              value={index.toString()}
              className="border border-border rounded-xl overflow-hidden bg-background data-[state=open]:border-foreground/20 transition-colors"
            >
              <AccordionTrigger className="px-5 py-4 cursor-pointer no-underline hover:no-underline text-left text-sm font-medium hover:bg-secondary/30 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 pt-0 border-t border-border">
                <p className="text-muted-foreground text-sm leading-relaxed pt-4">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
