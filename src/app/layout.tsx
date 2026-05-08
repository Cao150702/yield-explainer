import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yield Explainer — DeFi 收益策略透明化',
  description: '让 DeFi 不再是黑盒。AI 驱动的收益策略解释器。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">🌿 Yield Explainer</h1>
            <span className="text-sm text-gray-500">DeFi 收益策略透明化</span>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
