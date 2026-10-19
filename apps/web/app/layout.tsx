import type { Metadata } from "next";
import { Pixelify_Sans, Silkscreen } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { SITE_KEY } from "@/lib/api";
import { SITE_NAME, jsonLdString, siteJsonLd } from "@/lib/seo";
import "./globals.css";

const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixelify" });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-silkscreen" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${SITE_NAME} · Live Sports`, template: `%s · ${SITE_NAME}` },
  description: "NBA, NFL, NHL and MMA schedules, live scores and community livestreams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-site={SITE_KEY} className={`${pixelify.variable} ${silkscreen.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(siteJsonLd()) }} />
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
