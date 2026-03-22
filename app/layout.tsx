import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Journal Portal',
  description: 'Custom journal creation client portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Dancing+Script:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Josefin+Sans:wght@300;400;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700&family=Nunito:wght@300;400;600&family=Open+Sans:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@300;400;600;700&family=Sacramento&family=Satisfy&family=Spectral:ital,wght@0,300;0,400;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0f0f0f] text-[#f5f0e8] antialiased">
        {children}
      </body>
    </html>
  )
}
