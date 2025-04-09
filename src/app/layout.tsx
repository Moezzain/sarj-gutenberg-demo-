import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useTranslations } from 'next-intl';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// This function generates metadata based on params
export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  // Get the translations for the current locale
  const t = await getTranslations({ locale: params.locale, namespace: 'metadata' });
  
  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/sarj_logo.png',
      apple: '/sarj_logo.png',
    },
  };
}

export default function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const locale = params.locale || "en";
  const t = useTranslations();
  console.log('params');
  console.log(params.locale);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <img 
              src="/sarj_logo.png" 
              alt="SARJ AI" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-semibold">{t("navTitle")}</span>
          </div>
          <div className="flex gap-2">
            <Link href="/en" locale="en">
              <Button 
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
              >
                {t("navTitle")}
              </Button>
            </Link>
            <Link href="/ar" locale="ar">
              <Button 
                variant={locale === "ar" ? "default" : "outline"}
                size="sm"
              >
                {t("navTitle")}
              </Button>
            </Link>
          </div>
        </nav>

        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
