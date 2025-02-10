'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* 모바일 하단 네비게이션 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex justify-around px-2 py-3">
          {[
            { href: '/dashboard', icon: Home, label: '대시보드' },
            { href: '/business/resources', icon: FileText, label: '리소스' },
            { href: '/business/projects', icon: Calendar, label: '프로젝트' },
            { href: '/business/workers', icon: Users, label: '실무자' },
          ].map(({ href, icon: Icon, label }) => (
            <Link 
              key={href}
              href={href} 
              className="flex flex-col items-center"
            >
              <Icon className={`w-6 h-6 ${isActive(href) ? 'text-[#4E49E7]' : 'text-gray-500'}`} />
              <span className={`mt-1 text-[10px] ${isActive(href) ? 'text-[#4E49E7] font-bold' : 'text-gray-500'}`}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 데스크톱 사이드바 */}
      <aside className={`hidden sm:block fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-16' : 'w-60'}`}>
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
                className={`flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors ${
                  isActive(href) ? 'bg-gray-50' : ''
                }`}
                title={label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive(href) ? 'text-[#4E49E7]' : ''}`} />
                <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
                  isCollapsed 
                    ? 'w-0 opacity-0' 
                    : 'w-auto opacity-100 delay-[50ms]'
                } ${isActive(href) ? 'font-bold text-[#4E49E7]' : ''}`}>
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          {/* 하단 메뉴는 모바일에서 숨김 처리 */}
          <div className="flex-none space-y-1 pt-4 border-t border-gray-200">
            <Link 
              href="/dashboard/users"
              className={`flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors ${
                isActive('/dashboard/users') ? 'bg-gray-50' : ''
              }`}
              title="사용자 관리"
            >
              <Users className={`w-5 h-5 shrink-0 ${isActive('/dashboard/users') ? 'text-[#4E49E7]' : ''}`} />
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
                isCollapsed 
                  ? 'w-0 opacity-0' 
                  : 'w-auto opacity-100 delay-[50ms]'
              } ${isActive('/dashboard/users') ? 'font-bold text-[#4E49E7]' : ''}`}>
                사용자 관리
              </span>
            </Link>

            <Link 
              href="/dashboard/settings"
              className={`flex items-center h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors ${
                isActive('/dashboard/settings') ? 'bg-gray-50' : ''
              }`}
              title="설정"
            >
              <Settings className={`w-5 h-5 shrink-0 ${isActive('/dashboard/settings') ? 'text-[#4E49E7]' : ''}`} />
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
                isCollapsed 
                  ? 'w-0 opacity-0' 
                  : 'w-auto opacity-100 delay-[50ms]'
              } ${isActive('/dashboard/settings') ? 'font-bold text-[#4E49E7]' : ''}`}>
                설정
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className={`flex items-center w-full h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors ${
                isActive('/auth/login') ? 'bg-gray-50' : ''
              }`}
              title="로그아웃"
            >
              <LogOut className={`w-5 h-5 shrink-0 ${isActive('/auth/login') ? 'text-[#4E49E7]' : ''}`} />
              <span className={`ml-3 whitespace-nowrap overflow-hidden transition-[width,opacity] duration-300 text-[14px] ${
                isCollapsed 
                  ? 'w-0 opacity-0' 
                  : 'w-auto opacity-100 delay-[50ms]'
              } ${isActive('/auth/login') ? 'font-bold text-[#4E49E7]' : ''}`}>
                로그아웃
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
} 