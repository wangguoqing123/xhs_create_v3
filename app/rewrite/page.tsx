"use client"
import { Header } from "@/components/header"
import { RewriteInterface } from "@/components/rewrite-interface"

export default function RewritePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <Header />
      <main className="pt-4 pb-8">
        <RewriteInterface />
      </main>
    </div>
  )
}
