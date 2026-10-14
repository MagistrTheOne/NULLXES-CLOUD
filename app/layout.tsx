import type { Metadata, Viewport } from "next";
import "@fontsource/michroma";
import "@fontsource-variable/inter";
import "./globals.css";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
  title: "NULLXES Cloud — GPU / CPU infrastructure for AI and robotics",
  description: "Scalable GPU / CPU infrastructure for AI, robotics and next generation workloads.",
};
export const viewport: Viewport = { themeColor: "#050505", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-mono", jetbrainsMono.variable)}>
      <body>{children}</body>
    </html>
  );
}
