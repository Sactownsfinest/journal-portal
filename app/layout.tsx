import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Journal Portal',
  description: 'Custom journal creation client portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f0f] text-[#f5f0e8] antialiased">
        {children}
      </body>
    </html>
  )
}
