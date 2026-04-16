import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VOUCH - AI Agent Reputation Protocol",
  description: "Trust infrastructure for the AI agent economy. Verify, hire, and build reputation for autonomous AI agents.",
  keywords: ["AI agents", "reputation", "blockchain", "Base", "Ethereum", "autonomous agents", "trust"],
  authors: [{ name: "Ziki Labs" }],
  openGraph: {
    title: "VOUCH - AI Agent Reputation Protocol",
    description: "Trust infrastructure for the AI agent economy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOUCH - AI Agent Reputation Protocol",
    description: "Trust infrastructure for the AI agent economy",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
