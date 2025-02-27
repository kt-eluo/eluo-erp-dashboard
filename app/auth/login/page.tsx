'use client'
import Image from 'next/image'
import LoginForm from '@/components/auth/LoginForm'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import SignUpForm from '@/components/auth/SignUpForm'

export default function LoginPage() {
  const [showSignUp, setShowSignUp] = useState(false)
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [isSliding, setIsSliding] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // 로그인 모달 열기 (뒤로가기 버튼)
  const handleShowLogin = () => {
    setIsSliding(false);
    setTimeout(() => {
      setShowSignUp(false);
      setShowPasswordResetModal(false);
    }, 300);
  }

  // 회원가입 모달 열기
  const handleShowSignUp = () => {
    setIsSliding(true);
    setTimeout(() => {
      setShowSignUp(true);
    }, 500);
  }

  // 회원가입 모달 닫기
  const handleCloseSignUp = () => {
    setShowSignUp(false);
    setTimeout(() => {
      setIsSliding(false);
    }, 300);
  }

  // 비밀번호 재설정 모달 열기
  const handleShowPasswordReset = () => {
    setIsSliding(true);
    setTimeout(() => {
      setShowPasswordResetModal(true);
    }, 500);
  }

  // 비밀번호 재설정 모달 닫기
  const handleClosePasswordReset = () => {
    setShowPasswordResetModal(false);
    setTimeout(() => {
      setIsSliding(false);
    }, 300);
  }

  // 비밀번호 재설정 메일 발송
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) {
      setResetError('이메일을 입력해주세요')
      return
    }
    
    // 비밀번호 재설정 메일 발송 처리
    setIsResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      
      toast.success('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.')
      handleClosePasswordReset()
      setResetEmail('')
    } catch (error) {
      console.error('Error:', error)
      toast.error('비밀번호 재설정 메일 발송에 실패했습니다')
    } finally {
      setIsResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen login_page relative overflow-hidden">
      {/* 파란색 섹션 - 가장 낮은 z-index */}
      <div className={`w-full bg-[#3B82F6] p-6 md:p-8 lg:p-20 flex flex-col justify-center overflow-hidden transition-all duration-500 ease-in-out z-0 mn-lineTxt`}>
        {/* 장식용 도형 요소들 */}
        <div className="absolute top-0 left-20 w-64 h-64 rounded-full bg-white opacity-90 -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white opacity-10 translate-x-1/4 translate-y-1/4 animate-float-delay" />
        <div className="absolute top-1/2 right-12 w-32 h-1 bg-white opacity-20 rotate-45 animate-pulse-slow" />
        <div className="absolute top-1/3 left-5 w-24 h-24 rounded-full border-2 border-black opacity-100 animate-spin-slow" />
        
        {/* 텍스트 컨텐츠 */}
        <div className="text-white space-y-4 md:space-y-6 relative z-10 w-fit pl-20">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold">
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

      {/* 하얀색 섹션 - 중간 z-index */}
      <div className={`absolute top-0 right-0 w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-6 md:p-8 shadow-[-10px_0_25px_-3px_rgba(0,0,0,0.2)] bg-white transition-transform duration-500 ease-in-out z-10 ${
        isSliding ? 'translate-x-full' : 'translate-x-0'
      }`}>
        <div className="w-full max-w-md space-y-6 md:space-y-8 px-4 sm:px-0 relative z-20">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold">B2B 운영 관리</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">엘루오 하나로 올인원</p>
          </div>

          <LoginForm />

          <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-4 sm:mt-6">
              <button 
                type="button"
                className="relative z-30 text-gray-500 hover:text-gray-700 cursor-pointer py-2 px-3 rounded transition-colors"
                onClick={handleShowSignUp}
              >
                회원가입
              </button>
              <span className="text-gray-300">|</span>
              <button 
                className="relative z-30 text-gray-500 hover:text-gray-700 cursor-pointer py-2 px-3 rounded transition-colors"
                onClick={handleShowPasswordReset}
              >
                비밀번호 찾기
              </button>
              <span className="text-gray-300">|</span>
              <button className="relative z-30 text-gray-500 hover:text-gray-700 cursor-pointer py-2 px-3 rounded transition-colors">
                <a href="https://www.eluocnc.com/ko/main.asp" target='_blank'>회사홈</a>
              </button>
            </div>
          </div>

          <div className="mt-6 relative">
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              로그인 시{' '}
              <a href="#" className="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 transition-colors">
                서비스 이용약관
              </a>
              과{' '}
              <a href="#" className="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 transition-colors">
                개인정보 처리방침
              </a>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 회원가입 모달 */}
      {showSignUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl mx-4 animate-slide-up-modal">
            <div className="relative p-6 sm:p-8">
              <button 
                onClick={handleCloseSignUp}
                className="relative inline-flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
              
              <SignUpForm />
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 재설정 모달 */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl mx-4 animate-slide-up-modal">
            <div className="relative p-6 sm:p-8">
              <button 
                onClick={handleClosePasswordReset}
                className="relative inline-flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-xl">←</span>
              </button>
              <h2 className="text-2xl font-bold text-center mb-6">비밀번호 찾기</h2>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    가입한 이메일 주소를 입력해주세요
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value)
                      setResetError('')
                    }}
                    className={`mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      resetError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ycy@eluocnc.com"
                  />
                  {resetError && <p className="mt-1 text-xs sm:text-sm text-red-500">{resetError}</p>}
                </div>
                <button 
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-6 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isResetLoading ? '처리중...' : '비밀번호 재설정 메일 받기'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}