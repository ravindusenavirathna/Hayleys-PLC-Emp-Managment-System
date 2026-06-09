import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: "%s | LogiCore Enterprise WMS",
    default: "LogiCore Enterprise WMS",
  },
  description:
    "Enterprise Workforce and Task Management System — Streamline warehouse operations, worker allocation, and task tracking across all facilities.",
  keywords: ["warehouse management", "workforce allocation", "task management", "enterprise"],
  robots: "noindex, nofollow", // Demo only
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "font-sans text-sm",
              success: "border-emerald-200 bg-emerald-50 text-emerald-900",
              error: "border-red-200 bg-red-50 text-red-900",
            },
          }}
          richColors
          closeButton
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
