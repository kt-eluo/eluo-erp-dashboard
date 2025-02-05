'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (user) {
        // 프로필 조회
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.log('프로필이 없어 새로 생성합니다.')
          // 프로필이 없는 경우 새로 생성
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                role: 'Client',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])

          if (insertError) {
            console.error('프로필 생성 에러:', insertError)
            throw new Error('프로필 생성에 실패했습니다.')
          }
        }

        // 로그인 성공 후 리다이렉트
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('로그인 에러:', error)
      if (error instanceof Error) {
        setError(error.message)
        toast.error(error.message)
      } else {
        setError('로그인에 실패했습니다.')
        toast.error('로그인에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleError = (error: Error | null) => {
    // 구체적인 타입 지정
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-lg bg-black hover:bg-gray-800 text-white"
        disabled={loading}
      >
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}