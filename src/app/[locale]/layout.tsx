import Link from 'next/link';
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Poppins, Cairo } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import "../globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });
const cairo = Cairo({ subsets: ["latin"], weight: ["400", "700"] });

type ParentProp = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

// Generate metadata dynamically based on locale
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; 
  const t = await getTranslations({ locale, namespace: 'metadata' });
  
  return {
    title: t('title') || "Sarj - Gutenberg Book Analyzer",
    description: t('description') || "Analyze books from Project Gutenberg",
    icons: {
      icon: '/sarj_logo.png',
      apple: '/sarj_logo.png',
    },
  };
}

export default async function LocaleLayout({ children, params }: ParentProp) {
  const { locale } = await params; 
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const fontClass = locale === "en" ? poppins.className : cairo.className;

    // Enable static rendering
    setRequestLocale(locale);
  
    // Get messages for client-side translations
    const messages = await getMessages();
  
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className={`${fontClass} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <nav className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center gap-2">
              <img
                src="/sarj_logo.png"
                alt="SARJ AI"
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold">{t('title')}</span>
            </div>
            <div className="flex gap-2">
              <Link href="/en">
                <Button
                  variant={locale === "en" ? "default" : "outline"}
                  size="sm"
                >
                  English
                </Button>
              </Link>
              <Link href="/ar">
                <Button
                  variant={locale === "ar" ? "default" : "outline"}
                  size="sm"
                >
                  العربية
                </Button>
              </Link>
            </div>
          </nav>
          {children}
          <Toaster richColors position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}