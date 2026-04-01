import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Agent Escrow — Read-Only Beta",
  description:
    "A Solana-first escrow interface for AI agent workflows. The public frontend is a read-only beta with Solana Mainnet wallet connect.",
  keywords: ["Solana", "AI agents", "escrow", "read-only beta", "wallet adapter"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="pt-[72px] flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
