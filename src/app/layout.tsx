import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TradeHabit — Trading Journal",
  description: "A modern trading journal for disciplined traders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0e1223",
              border: "1px solid #1e293b",
              color: "#f8fafc",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
