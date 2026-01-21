import { Metadata } from "next";
import { siteConfig } from "@/lib/landing/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: [
    "Loura",
    "AI",
    "Gestion",
    "Entreprise",
    "Organisation",
    "Ressources humaines",
    "Administration",
  ],
  authors: [
    {
      name: "Loura",
      url: "https://loura.app",
    },
  ],
  creator: "Loura",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: "@loura",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
