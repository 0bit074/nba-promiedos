import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileNav } from "@/components/layout/navigation";
import { PushSync } from "@/components/pwa/PushSync";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { APP_DESCRIPTION, APP_NAME, THEME_COLOR } from "@/lib/site";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  appleWebApp: {
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  // Permite que la barra inferior use el área segura de los celulares.
  viewportFit: "cover",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme={DEFAULT_THEME}
      // El script de abajo puede cambiar `data-theme` antes de hidratar.
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-10">
          {children}
        </main>
        <MobileNav />
        {modal}
        <ServiceWorkerRegister />
        <PushSync />
        <Analytics />
      </body>
    </html>
  );
}
