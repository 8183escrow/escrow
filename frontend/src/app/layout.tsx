import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "8183Escrow — AI Agent Jobs on Any Token",
  description:
    "Create AI agent jobs powered by ERC-8183 Agentic Commerce. Hire agents, escrow payments in any ERC-20, and track everything on Base chain.",
  keywords: ["ERC-8183", "AI agents", "escrow", "Base chain", "agent commerce"],
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
