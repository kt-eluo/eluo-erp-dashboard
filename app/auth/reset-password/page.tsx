'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    if (newPassword.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('비밀번호가 성공적으로 변경되었습니다.')
      router.push('/auth/login')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* 파란색 섹션 */}
      <div className="w-full bg-[#3B82F6] p-6 md:p-8 lg:p-12 flex flex-col justify-center overflow-hidden">
        {/* 장식용 도형 요소들 */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white opacity-10 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white opacity-10 translate-x-1/4 translate-y-1/4 animate-float-delay" />
        <div className="absolute top-1/2 right-12 w-32 h-1 bg-white opacity-20 rotate-45 animate-pulse-slow" />
        <div className="absolute top-1/3 left-0 w-24 h-24 rounded-full border-4 border-white opacity-20 animate-spin-slow" />

        {/* 메인 컨텐츠 */}
        <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-6 md:p-8 shadow-[-10px_0_25px_-3px_rgba(0,0,0,0.2)] bg-white">
          <div className="w-full max-w-md space-y-6 md:space-y-8 px-4 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">비밀번호 재설정</h2>
              <p className="mt-2 text-sm text-gray-600">새로운 비밀번호를 입력해주세요</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호"
                    className="h-12 text-lg px-4"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 확인"
                    className="h-12 text-lg px-4"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background w-full h-12 text-lg bg-black hover:bg-gray-800 text-white"
              >
                {loading ? '처리중...' : '비밀번호 변경'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  로그인 페이지로 돌아가기
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 왼쪽 텍스트 컨텐츠 */}
        <div className="text-white space-y-4 md:space-y-6 relative z-10 w-fit">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Eluo
            <br />
            In Your
            <br />
            Business Log
          </h1>
          <p className="text-base md:text-lg opacity-80">
            혼자서도 충분히 관리할 수 있는 비즈니스!
            <br />
            모든 영업 & 정산 기록을 엘루오와 연결하고 관리하세요.
          </p>
        </div>
      </div>
    </div>
  )
} 