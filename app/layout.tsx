import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Matchire - CV Similarity',
  description: 'Upload CVs and compare against a job description'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* - min-h-screen w-screen: Tam ekran kapla
         - bg-custom... : Arka plan resmini ayarla
         - overflow-x-hidden: Yatay kaydırmayı engelle
      */}
      <body className="min-h-screen w-full bg-custom bg-cover bg-center bg-fixed bg-no-repeat overflow-x-hidden text-slate-900 font-sans">
        {/* max-w-5xl kısıtlamasını kaldırdık. 
           Artık Dashboard tüm genişliği kullanabilir.
        */}
        <main className="w-full h-full">
          {children}
        </main>
      </body>
    </html>
  )
}