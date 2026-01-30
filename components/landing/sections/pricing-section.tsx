"use client";

import { SectionHeader } from "@/components/landing/section-header";
import { siteConfig } from "@/lib/landing/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

interface TabsProps {
  activeTab: "yearly" | "monthly";
  setActiveTab: (tab: "yearly" | "monthly") => void;
  className?: string;
}

function PricingTabs({ activeTab, setActiveTab, className }: TabsProps) {
  return (
    <div
      className={cn(
        "relative flex w-fit items-center rounded-full border border-border p-1 backdrop-blur-sm cursor-pointer bg-background",
        className,
      )}
    >
      {["monthly", "yearly"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as "yearly" | "monthly")}
          className={cn(
            "relative z-[1] px-4 py-2 flex items-center justify-center cursor-pointer text-sm font-medium rounded-full transition-colors",
            {
              "z-0": activeTab === tab,
            },
          )}
        >
          {activeTab === tab && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-full bg-foreground"
              transition={{
                duration: 0.2,
                type: "spring",
                stiffness: 300,
                damping: 25,
                velocity: 2,
              }}
            />
          )}
          <span
            className={cn(
              "relative block transition-colors duration-200",
              activeTab === tab ? "text-background" : "text-muted-foreground",
            )}
          >
            {tab === "monthly" ? "Mensuel" : "Annuel"}
            {tab === "yearly" && (
              <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                -20%
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  // Update price animation
  const PriceDisplay = ({
    tier,
  }: {
    tier: (typeof siteConfig.pricing.pricingItems)[0];
  }) => {
    const price = billingCycle === "yearly" ? tier.yearlyPrice : tier.price;

    return (
      <motion.span
        key={price}
        className="text-4xl md:text-5xl font-display font-bold tracking-tight"
        initial={{
          opacity: 0,
          x: billingCycle === "yearly" ? -10 : 10,
          filter: "blur(5px)",
        }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {price}
      </motion.span>
    );
  };

  return (
    <section
      id="pricing"
      className="flex flex-col items-center justify-center gap-10 py-20 w-full relative px-6"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-center text-balance">
          <span className="font-display font-bold">Tarifs</span>
          <span className="text-muted-foreground font-normal"> simples et </span>
          <span className="font-display font-bold italic">transparents</span>
        </h2>
        <p className="text-muted-foreground text-center text-balance font-normal max-w-2xl mx-auto">
          {siteConfig.pricing.description}
        </p>
      </SectionHeader>
      
      <div className="relative w-full h-full">
        <div className="flex justify-center mb-12">
          <PricingTabs
            activeTab={billingCycle}
            setActiveTab={setBillingCycle}
          />
        </div>

        <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          {siteConfig.pricing.pricingItems.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "rounded-2xl flex flex-col relative h-full border transition-all duration-300",
                tier.isPopular
                  ? "border-foreground shadow-lg bg-foreground text-background"
                  : "border-border bg-background hover:border-foreground/20",
              )}
            >
              {/* Popular badge */}
              {tier.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-background text-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}
              
              <div className="flex flex-col gap-4 p-6 pb-4">
                <p className={cn(
                  "text-sm font-medium",
                  tier.isPopular ? "text-background/70" : "text-muted-foreground"
                )}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <PriceDisplay tier={tier} />
                  <span className={cn(
                    "text-sm",
                    tier.isPopular ? "text-background/60" : "text-muted-foreground"
                  )}>
                    /{billingCycle === "yearly" ? "an" : "mois"}
                  </span>
                </div>
                <p className={cn(
                  "text-sm",
                  tier.isPopular ? "text-background/70" : "text-muted-foreground"
                )}>
                  {tier.description}
                </p>
              </div>

              <div className="p-6 pt-0">
                <button
                  className={cn(
                    "group w-full h-11 flex items-center justify-center gap-2 text-sm font-medium rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95",
                    tier.isPopular
                      ? "bg-background text-foreground hover:bg-background/90"
                      : "bg-foreground text-background hover:bg-foreground/90",
                  )}
                >
                  {tier.buttonText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              
              <div className={cn(
                "border-t p-6",
                tier.isPopular ? "border-background/20" : "border-border"
              )}>
                {tier.name !== "Gratuit" && (
                  <p className={cn(
                    "text-xs mb-4",
                    tier.isPopular ? "text-background/60" : "text-muted-foreground"
                  )}>
                    Tout de {tier.name === "Professionnel" ? "Gratuit" : "Pro"}, plus :
                  </p>
                )}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "size-5 rounded-full flex items-center justify-center mt-0.5 shrink-0",
                          tier.isPopular
                            ? "bg-background/20"
                            : "bg-foreground/10",
                        )}
                      >
                        <Check className={cn(
                          "size-3",
                          tier.isPopular ? "text-background" : "text-foreground"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm",
                        tier.isPopular ? "text-background/90" : "text-foreground"
                      )}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
