import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Academic Resort',
  description: 'Dynamic academic resources for university batches',
  icons: {
    icon: '/icon.svg',
  },
}

import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50/50`}>
        <Suspense fallback={<div className="h-1 bg-brand animate-loading-bar" />}>
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
