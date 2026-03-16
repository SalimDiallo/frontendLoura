import { ServiceWorkerProvider } from "@/components/providers/sw-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Police principale : Space Grotesk depuis next/google-fonts
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Police monospace pour le code
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});


export const metadata: Metadata = {
  title: "Loura - Gestion d'entreprise",
  description: "Plateforme de gestion multi-tenant pour votre entreprise",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loura",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Loura",
    title: "Loura - Gestion d'entreprise",
    description: "Plateforme de gestion multi-tenant pour votre entreprise",
  },
  twitter: {
    card: "summary",
    title: "Loura - Gestion d'entreprise",
    description: "Plateforme de gestion multi-tenant pour votre entreprise",
  },
};

export const viewport: Viewport = {
  themeColor: "#667eea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/images/logo-icon.png" />
      </head>
      <body
        className={`${spaceGrotesk.className} ${spaceGrotesk.variable} ${jetbrainsMono.variable}   ${playfairDisplay.variable} font-sans antialiased`}
      >
        <ThemeProvider defaultTheme="system" storageKey="loura-ui-theme">
          <ServiceWorkerProvider>
            {children}
          </ServiceWorkerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
