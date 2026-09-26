import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tischliste · Gemeinsam essen",
  description: "Mittagessen und Frühstück erfassen. Alle Beiträge im Blick.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
