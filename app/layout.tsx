import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-context"
import { CreditsProvider } from "@/components/credits-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "灵感矩阵 - AI驱动的内容创作平台",
  description: "让一个灵感裂变成无数可能，专为小红书创作者打造的智能内容生成工具",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 临时测试：防止闪屏的CSS */
            * { 
              transition: none !important; 
              animation-duration: 0s !important; 
            }
            html, body { 
              background: white !important; 
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <CreditsProvider>
              {children}
            </CreditsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
