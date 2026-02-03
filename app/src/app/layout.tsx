/**
 * Root Layout
 * 
 * The root layout component that wraps all pages.
 * Includes global providers, fonts, and styling.
 * 
 * @module app/layout
 */

import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { SessionProvider } from "@/components/providers"

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "UniCore-OS | نظام إدارة جامعي متكامل",
  description: "نظام تشغيل جامعي متكامل لإدارة المحتوى الأكاديمي والاختبارات الذكية",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${cairo.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
