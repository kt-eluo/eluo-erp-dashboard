'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell, Flag } from 'lucide-react'

// UserRole 타입을 명시적으로 정의
type UserRole = 'ADMIN' | 'CPO' | 'MANAGER' | 'USER';

interface Notification {
  id: string
  message: string
  read: boolean
  created_at: string
}

export default function Header() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError;
        
        if (!user) {
          console.log('로그인이 필요합니다')
          return
        }

        // 디버깅을 위한 로그 추가
        console.log('현재 사용자 ID:', user.id)

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, email')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('프로필 조회 에러:', profileError.message) // error 객체의 message 속성 출력
          return
        }

        if (profile) {
          console.log('프로필 데이터:', profile) // 디버깅용
          setUserRole(profile.role as UserRole)
          setUserEmail(profile.email)
        } else {
          // 프로필이 없는 경우 새로 생성
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                role: 'USER' // 기본 역할
              }
            ])
            .single()

          if (insertError) {
            console.error('프로필 생성 에러:', insertError.message)
            return
          }

          setUserRole('USER')
          setUserEmail(user.email || '')
        }
      } catch (error) {
        console.error('데이터 조회 중 에러 발생:', error)
      }
    }

    fetchUserData()
  }, [supabase])

  // 알림 가져오기
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })

      if (data) {
        setNotifications(data)
      }
    }

    fetchNotifications()
  }, [supabase])

  const getInitial = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  // 역할에 따른 표시 텍스트
  const getRoleDisplay = (role: UserRole | null) => {
    if (!role) return 'Loading...'
    
    const roleMap: Record<UserRole, string> = {
      'ADMIN': '관리자',
      'CPO': 'CPO',
      'MANAGER': '매니저',
      'USER': '일반사용자'
    }
    
    return roleMap[role] || role
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-black z-50">
      <div className="mx-auto px-6 h-full flex items-center justify-between">
        {/* 좌측: 역할 표시 */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border border-black">
            <Flag 
              className={`w-4 h-4 ${
                userRole === 'ADMIN' ? 'text-black-500 fill-red-500' :
                userRole === 'CPO' ? 'text-black-500 fill-purple-500' :
                userRole === 'MANAGER' ? 'text-black-500 fill-green-500' :
                'text-black-400 fill-blue-400'
              }`} 
            />
            <span>{getRoleDisplay(userRole)}</span>
          </div>
        </div>

        {/* 우측: 알림 & 프로필 */}
        <div className="flex items-center space-x-4">
          {/* 알림 아이콘 */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative w-9 h-9 rounded-full border border-black inline-flex items-center justify-center text-sm font-medium leading-none"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6Z"/>
                <path d="M10 18a2 2 0 1 0 4 0"/>
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 border-black">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`px-4 py-2 hover:bg-gray-50 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    알림이 없습니다
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 프로필 이니셜 */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-gray-100 border border-black text-black-700 inline-flex items-center justify-center text-sm font-medium leading-none">
              {userEmail ? getInitial(userEmail) : '?'}
            </div>
          </div>
        </div>
      </div>

    </header>
  )
} 