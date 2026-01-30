import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Host_Grotesk, Hanken_Grotesk, Familjen_Grotesk, Darker_Grotesque, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.className} ${spaceGrotesk.variable} ${jetbrainsMono.variable}   ${playfairDisplay.variable} font-sans antialiased`}
      >
        <ThemeProvider defaultTheme="system" storageKey="loura-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
