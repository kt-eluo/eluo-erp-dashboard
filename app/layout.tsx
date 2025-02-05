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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  
  const showHeader = !pathname.includes('/auth/login')
  const showSidebar = pathname.startsWith('/dashboard') || pathname.startsWith('/business')

  return (
    <html lang="ko" className={pretendard.className}>
      <body>
        {showHeader && <Header />}
        {showSidebar && (
          <Sidebar 
            isSidebarOpen={isSidebarOpen} 
            setIsSidebarOpen={setIsSidebarOpen}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        )}
        <main className={`${showHeader ? 'pt-16' : ''} transition-all duration-300 ${
          showSidebar ? (
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          ) : ''
        }`}>
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
