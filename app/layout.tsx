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
import Sidebar from '@/components/Sidebar'
import CommandBar from '@/components/CommandBar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CommandBar>
          <Sidebar />
          <div className="main-content-wrapper p-4 md:p-8 ml-0 md:ml-sidebar transition-all duration-300">
            <Suspense fallback={<div className="h-1 bg-brand animate-loading-bar" />}>
              {children}
            </Suspense>
          </div>
        </CommandBar>
        <Analytics />
      </body>
    </html>
  )
}
