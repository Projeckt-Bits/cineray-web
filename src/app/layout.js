import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext.js';

export const metadata = {
  title: "Sun Tracking App",
  description: "A comprehensive solar position calculator and visualization tool for photographers, filmmakers, and outdoor enthusiasts",
  keywords: ["sun", "solar", "tracking", "photography", "golden hour", "compass", "mapbox", "pwa"],
  authors: [{ name: "Sun Tracking App Team" }],
  creator: "Sun Tracking App",
  publisher: "Sun Tracking App",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sun Tracking App",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div id="root">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
