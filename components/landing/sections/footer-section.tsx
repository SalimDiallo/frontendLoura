"use client";

import { Icons } from "@/components/landing/icons";
import { FlickeringGrid } from "@/components/landing/ui/flickering-grid";
import Logo from "@/components/ui/Logo";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { siteConfig } from "@/lib/landing/config";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export function FooterSection() {
  const tablet = useMediaQuery("(max-width: 1024px)");

  return (
    <footer id="footer" className="w-full pb-0 bg-background">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-10 md:p-16 gap-10">
        {/* Logo et description */}
        <div className="flex flex-col items-start justify-start gap-y-6 max-w-sm">
          <Link href="/" className="flex items-center gap-3">
          <Logo className="flex justify-center items-center gap-2" />
          </Link>
          <p className="tracking-tight text-muted-foreground text-sm leading-relaxed">
            {siteConfig.hero.description}
          </p>
          {/* Badges de conformité */}
          <div className="flex items-center gap-3 dark:hidden opacity-60">
            <Icons.soc2 className="size-10" />
            <Icons.hipaa className="size-10" />
            <Icons.gdpr className="size-10" />
          </div>
          <div className="dark:flex items-center gap-3 hidden opacity-60">
            <Icons.soc2Dark className="size-10" />
            <Icons.hipaaDark className="size-10" />
            <Icons.gdprDark className="size-10" />
          </div>
        </div>
        
        {/* Liens du footer */}
        <div className="flex-1 md:pl-16">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-start md:justify-end gap-y-8 gap-x-16">
            {siteConfig.footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-3">
                <li className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-sm text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-4 items-center justify-center translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-3 w-3" />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      
      {/* Séparateur */}
      <div className="border-t border-border mx-10 md:mx-16"></div>
      
      {/* Copyright */}
      <div className="flex flex-col md:flex-row items-center justify-between px-10 md:px-16 py-6 gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LouraTech. Tous droits réservés.
        </p>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Conditions</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Cookies</Link>
        </div>
      </div>
      
      {/* Animation du footer */}
      <div className="w-full h-32 md:h-40 relative mt-8 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background z-10 from-30%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text={tablet ? "LouraTech" : "Gestion simplifiée"}
            fontSize={tablet ? 60 : 80}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#404040"
            maxOpacity={0.2}
            flickerChance={0.08}
          />
        </div>
      </div>
    </footer>
  );
}
