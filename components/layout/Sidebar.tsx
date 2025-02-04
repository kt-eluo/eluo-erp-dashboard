'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { X, Home, Users, Settings, LogOut, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <aside className={`fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] transition-all duration-300 ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="h-full px-3 py-4 overflow-y-auto bg-white border-r border-gray-200 relative">
        <div className="flex justify-end mb-6">
          <button 
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <nav className="space-y-1">
          {[
            { href: '/dashboard', icon: Home, label: '대시보드' },
            { href: '/dashboard/sales', icon: Calendar, label: '매출관리' },
            { href: '/dashboard/settlements', icon: FileText, label: '정산관리' },
            { href: '/dashboard/users', icon: Users, label: '사용자 관리' },
            { href: '/dashboard/settings', icon: Settings, label: '설정' },
          ].map(({ href, icon: Icon, label }) => (
            <Link 
              key={href}
              href={href} 
              className="flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors"
              title={label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
              }`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={handleLogout}
            className="flex items-center w-full h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${
              isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
            }`}>
              로그아웃
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
} 