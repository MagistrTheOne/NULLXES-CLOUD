import type { Metadata, Viewport } from "next";
import "@fontsource/michroma";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "NULLXES Cloud — GPU / CPU infrastructure for AI and robotics",
  description: "Scalable GPU / CPU infrastructure for AI, robotics and next generation workloads.",
};
export const viewport: Viewport = { themeColor: "#050505", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
