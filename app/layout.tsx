import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Academic Resort — A&IS, University of Dhaka',
    template: '%s | Academic Resort',
  },
  description: 'Academic resource hub for the Department of Accounting & Information Systems, University of Dhaka. Access course materials, lecture slides, and past questions organized by batch and semester.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Academic Resort — A&IS, University of Dhaka',
    description: 'Your academic companion for A&IS. Course materials, lecture slides, and past questions organized by batch and semester.',
    type: 'website',
    locale: 'en_US',
  },
  metadataBase: new URL('https://academic-resort.vercel.app'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#215d6b',
}

import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <Suspense fallback={<div className="h-1 bg-primary animate-shimmer" />}>
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
