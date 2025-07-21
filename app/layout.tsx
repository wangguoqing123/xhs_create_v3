import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MySQLAuthProvider } from "@/components/mysql-auth-context"
import { CreditsProvider } from "@/components/credits-context"
import { DatabaseInitializer } from "@/components/database-initializer"
import { LayoutContent } from "@/components/layout-content"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "灵感矩阵 - AI驱动的内容创作平台",
  description: "让一个灵感裂变成无数可能，专为小红书创作者打造的智能内容生成工具",
  generator: 'v0.dev'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="theme-preference"
        >
          <DatabaseInitializer />
          <MySQLAuthProvider>
            <CreditsProvider>
              <LayoutContent>
                {children}
              </LayoutContent>
            </CreditsProvider>
          </MySQLAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
