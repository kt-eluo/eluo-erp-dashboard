'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { X, Home, Users, Settings, LogOut, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (isCollapsed: boolean) => void
}

export default function Sidebar({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  isCollapsed, 
  setIsCollapsed 
}: SidebarProps) {
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
    <aside className={`fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] transition-all duration-300 ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="h-full flex flex-col px-3 py-4 bg-white border-r border-gray-200 relative shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
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
        
        <nav className="flex-1 space-y-1 min-h-0">
          {[
            { href: '/dashboard', icon: Home, label: '대시보드' },
            { href: '/business/resources', icon: FileText, label: '리소스 관리' },
            { href: '/business/projects', icon: Calendar, label: '프로젝트 관리' },
            { href: '/business/workers', icon: Users, label: '실무자 관리' },
          ].map(({ href, icon: Icon, label }) => (
            <Link 
              key={href}
              href={href} 
              className="flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors"
              title={label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
                isCollapsed 
                  ? 'w-0 opacity-0' 
                  : 'w-auto opacity-100 delay-[50ms]'
              }`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex-none space-y-1 pt-4 border-t border-gray-200">
          <Link 
            href="/dashboard/users"
            className="flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="사용자 관리"
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
              isCollapsed 
                ? 'w-0 opacity-0' 
                : 'w-auto opacity-100 delay-[50ms]'
            }`}>
              사용자 관리
            </span>
          </Link>

          <Link 
            href="/dashboard/settings"
            className="flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="설정"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
              isCollapsed 
                ? 'w-0 opacity-0' 
                : 'w-auto opacity-100 delay-[50ms]'
            }`}>
              설정
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
              isCollapsed 
                ? 'w-0 opacity-0' 
                : 'w-auto opacity-100 delay-[50ms]'
            }`}>
              로그아웃
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
} 