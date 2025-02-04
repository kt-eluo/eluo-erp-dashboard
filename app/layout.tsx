'use client'

import localFont from 'next/font/local'
import "./globals.css"
import './styles/custom.css'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const pretendard = localFont({
  src: [
    {
      path: '../public/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const showSidebar = pathname.startsWith('/dashboard')

  return (
    <html lang="ko" className={pretendard.className}>
      <body>
        <Header />
        {showSidebar && (
          <Sidebar 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen} 
          />
        )}
        <main className={`pt-16 ${showSidebar && isSidebarOpen ? 'lg:ml-64' : ''}`}>
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
