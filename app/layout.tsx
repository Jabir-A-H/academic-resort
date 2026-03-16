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

import Sidebar from '@/components/Sidebar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Sidebar />
        <div className="main-content-wrapper">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
