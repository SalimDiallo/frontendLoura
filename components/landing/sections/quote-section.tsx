import { siteConfig } from "@/lib/landing/config";

export function QuoteSection() {
  const { quoteSection } = siteConfig;

  return (
    <section
      id="quote"
      className="flex flex-col items-center justify-center w-full py-24 px-6 bg-secondary/30"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Citation avec style élégant */}
        <blockquote className="relative">
          {/* Guillemets décoratifs */}
          <span className="absolute -top-8 -left-4 text-8xl font-display text-foreground/5 select-none">"</span>
          
          <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed tracking-tight text-foreground/90 mb-10">
            <span className="font-display italic">{quoteSection?.quote}</span>
          </p>
          
          {/* Auteur */}
          <footer className="flex items-center justify-center gap-4">
            {quoteSection?.author?.image && (
              <img
                src={quoteSection.author.image}
                alt={quoteSection.author.name}
                width={48}
                height={48}
                className="rounded-full grayscale size-12 object-cover"
              />
            )}
            <div className="text-left">
              <p className="font-semibold text-sm">{quoteSection?.author?.name}</p>
              <p className="text-muted-foreground text-sm">{quoteSection?.author?.role}</p>
            </div>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
