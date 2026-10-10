import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kuro Labs | Curated Essentials & E-Commerce System",
  description:
    "Curated lifestyle & workspace essentials, mechanical keyboards, studio-grade acoustics, and precision tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-full bg-zinc-950 text-zinc-100 flex flex-col`}
        suppressHydrationWarning
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Clean up extension attributes before React hydrates
              document.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
            `,
          }}
        />
      </body>
    </html>
  );
}
