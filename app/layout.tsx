import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Matchire - CV Similarity',
  description: 'Upload CVs and compare against a job description'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen w-screen bg-custom bg-cover bg-center bg-fixed bg-no-repeat">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  )
}
