import { siteConfig } from "@/lib/landing/config";
import Link from "next/link";

export function CompanyShowcase() {
  const { companyShowcase } = siteConfig;
  return (
    <section
      id="company"
      className="flex flex-col items-center justify-center gap-8 py-16 pt-24 w-full relative px-6"
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance pb-2">
        <span className="font-display font-bold">Ils</span>
        <span className="text-muted-foreground font-normal"> nous font </span>
        <span className="font-display font-bold italic">confiance</span>
      </h2>
      <div className="grid w-full max-w-6xl grid-cols-2 md:grid-cols-4 overflow-hidden border-y border-border items-center justify-center z-20">
        {companyShowcase?.companyLogos?.slice(0, 8).map((logo) => (
          <Link
            href="#"
            className="group w-full h-24 flex items-center justify-center relative p-4 before:absolute before:-left-1 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-1 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-[''] opacity-50 hover:opacity-100 transition-opacity duration-300"
            key={logo.id}
          >
            <div className="flex items-center justify-center w-full h-full grayscale hover:grayscale-0 transition-all duration-300">
              {logo.logo}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
