'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import type { UserRole } from '@/types/auth'

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const supabase = createClientComponentClient()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      // 1. 회원가입 시도
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'Client' as UserRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      })

      if (authError) {
        console.error('Auth Error:', authError)
        throw authError
      }

      if (authData.user) {
        // 2. user_profiles 테이블에 사용자 정보 저장
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              role: 'Client',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (profileError) {
          console.error('Profile Error:', profileError)
          throw profileError
        }

        toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
        setIsSuccess(true)
      }
    } catch (err) {
      console.error('회원가입 에러:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('회원가입에 실패했습니다.')
      }
      toast.error('회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 회원가입 완료 메시지 */}
      {isSuccess && (
        <div className="text-green-600 text-center py-2 bg-green-50 rounded-lg mb-4">
          회원가입이 완료되었습니다.
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-lg px-4"
            disabled={loading}
            required
          />
        </div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-lg px-4"
            disabled={loading}
            required
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
        <div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 text-lg px-4"
            disabled={loading}
            required
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button 
        type="submit"
        className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background w-full h-12 text-lg bg-black hover:bg-gray-800 text-white"
        disabled={loading}
      >
        {loading ? '처리중...' : '회원가입'}
      </button>
    </form>
  )
}