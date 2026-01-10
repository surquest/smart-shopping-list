import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import ServiceWorkerRegistration from '@/components/ShoppingList/ServiceWorkerRegistration';
import InstallPrompt from '@/components/InstallPrompt';
import AppLayout from "@/components/AppLayout/AppLayout";
import { TranslationProvider } from '@/i18n/TranslationProvider';
import HtmlLangUpdater from '@/components/HtmlLangUpdater';
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Shopping List",
  description: "Progressive web app for managing your shopping list",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shopping List",
  },
  icons: {
    apple: "/icon-192x192.png",
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ServiceWorkerRegistration />
            <TranslationProvider>
              <HtmlLangUpdater />
              <AppLayout>
                {children}
                <InstallPrompt />
              </AppLayout>
            </TranslationProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
