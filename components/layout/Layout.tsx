'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <main className={`pt-14 transition-all duration-300 lg:ml-60 ${
        isSidebarOpen 
          ? isCollapsed 
            ? 'sm:pl-16'
            : 'sm:pl-60'
          : 'sm:pl-0'
      }`}>
        {children}
      </main>
    </div>
  )
} 