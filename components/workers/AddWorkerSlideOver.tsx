'use client'

import { useState } from 'react'
import { X, ArrowLeft, Trash2 } from 'lucide-react'
import type { WorkerJobType, WorkerLevelType } from '@/types/worker'

interface AddWorkerSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  onDelete?: () => void
  isEdit?: boolean
  workerId?: string
}

export default function AddWorkerSlideOver({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  isEdit = false,
  workerId 
}: AddWorkerSlideOverProps) {
  const [name, setName] = useState('')
  const [jobType, setJobType] = useState<WorkerJobType | ''>('')
  const [level, setLevel] = useState<WorkerLevelType | ''>('')
  const [price, setPrice] = useState('')
  const [isDispatched, setIsDispatched] = useState<boolean | null>(null)
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false)
  const [isLevelOpen, setIsLevelOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)
  const [tempPrice, setTempPrice] = useState('')
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발']
  const levels: WorkerLevelType[] = ['초급', '중급', '고급']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      job_type: jobType,
      level,
      price: parseInt(price.replace(/,/g, '')),
      is_dispatched: isDispatched
    })
  }

  const formatPrice = (value: string) => {
    const number = value.replace(/[^0-9]/g, '')
    return number ? parseInt(number).toLocaleString() : ''
  }

  const addPrice = (amount: number) => {
    const currentPrice = parseInt(tempPrice.replace(/,/g, '') || '0')
    setTempPrice(formatPrice((currentPrice + amount).toString()))
  }

  return (
    <div className={`fixed inset-0 overflow-hidden z-50 ${!isOpen && 'pointer-events-none'}`}>
      <div className="absolute inset-0 overflow-hidden">
        {/* 배경 오버레이 */}
        <div 
          className={`absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={onClose}
        />

        {/* 슬라이드 오버 패널 */}
        <div className={`fixed inset-y-0 right-0 pl-10 max-w-full flex transform transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="w-[900px] flex flex-col">
            {/* 공통 헤더 */}
            <div className="flex-none px-4 py-4 bg-gray-50 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 mr-4"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onDelete}
                    className="px-3 py-1.5 text-sm font-medium text-black-500 hover:text-white border border-black-200 rounded-md hover:bg-red-600 transition-colors duration-200"
                  >
                    삭제하기
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-sm font-medium text-black-500 hover:text-white border border-black-600 rounded-md hover:bg-gray-600 transition-colors duration-200"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>

            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 폼 영역 */}
              <div className="w-[420px] flex flex-col bg-white overflow-y-auto">
                <form id="workerForm" onSubmit={handleSubmit} className="flex-1">
                  {/* 실무자 아이콘과 텍스트 영역 */}
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center text-sm text-[#4E49E7]">
                      <svg 
                        className="w-5 h-5 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                      실무자
                    </div>
                  </div>

                  <div className="flex-1 px-6 space-y-8">
                    {/* 이름 */}
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border-0 border-b-2 border-transparent bg-transparent text-3xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2"
                        required
                        placeholder="이름"
                      />
                    </div>

                    {/* 직무 */}
                    <div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsJobTypeOpen(!isJobTypeOpen)}
                          className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                        >
                          <span className={jobType ? 'text-gray-900' : 'text-gray-400'}>
                            {jobType || '직무'}
                          </span>
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isJobTypeOpen ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {isJobTypeOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                            <div className="py-1">
                              {jobTypes.map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    setJobType(type)
                                    setIsJobTypeOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                    jobType === type ? 'text-[#4E49E7] font-medium' : 'text-gray-900'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 등급 */}
                    <div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLevelOpen(!isLevelOpen)}
                          className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                        >
                          <span className={level ? 'text-gray-900' : 'text-gray-400'}>
                            {level || '등급'}
                          </span>
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isLevelOpen ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {isLevelOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                            <div className="py-1">
                              {levels.map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    setLevel(type)
                                    setIsLevelOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                    level === type ? 'text-[#4E49E7] font-medium' : 'text-gray-900'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 단가 */}
                    <div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPriceOpen(!isPriceOpen)}
                          className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                        >
                          <span className={price ? 'text-gray-900' : 'text-gray-400'}>
                            {price ? `${price}원` : '단가'}
                          </span>
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isPriceOpen ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {isPriceOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 p-4">
                            {/* 금액 증가 버튼들 */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              <button
                                type="button"
                                onClick={() => addPrice(100000000)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                              >
                                +억
                              </button>
                              <button
                                type="button"
                                onClick={() => addPrice(10000000)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                              >
                                +천만
                              </button>
                              <button
                                type="button"
                                onClick={() => addPrice(1000000)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                              >
                                +백만
                              </button>
                              <button
                                type="button"
                                onClick={() => addPrice(100000)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                              >
                                +십만
                              </button>
                            </div>

                            {/* 금액 입력 필드 */}
                            <div className="relative mb-4">
                              <input
                                type="text"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(formatPrice(e.target.value))}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4E49E7] focus:border-[#4E49E7]"
                                placeholder="직접 입력"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">원</span>
                              </div>
                            </div>

                            {/* 입력 완료 버튼 */}
                            <button
                              type="button"
                              onClick={() => {
                                setPrice(tempPrice)
                                setIsPriceOpen(false)
                              }}
                              className="w-full py-2 px-4 bg-[#4E49E7] text-white rounded-md hover:bg-[#3F3ABE] transition-colors"
                            >
                              입력완료
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 파견 여부 */}
                    <div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDispatchOpen(!isDispatchOpen)}
                          className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                        >
                          <span className={isDispatched !== null ? 'text-gray-900' : 'text-gray-400'}>
                            {isDispatched === true ? '파견중' : isDispatched === false ? '파견안함' : '파견 여부'}
                          </span>
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isDispatchOpen ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {isDispatchOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDispatched(true)
                                  setIsDispatchOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                  isDispatched === true ? 'text-[#4E49E7] font-medium' : 'text-gray-900'
                                }`}
                              >
                                파견중
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDispatched(false)
                                  setIsDispatchOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                  isDispatched === false ? 'text-[#4E49E7] font-medium' : 'text-gray-900'
                                }`}
                              >
                                파견안함
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* 프로젝트 영역 */}
              <div className="w-[480px] flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
                {/* 프로젝트 헤더 */}
                <div className="flex-none border-b border-gray-200">
                  <nav className="flex">
                    <button className="px-4 py-2 text-sm font-medium border-b-2 border-black">
                      진행중 <span className="text-gray-500">0</span>
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent">
                      진행 예정 <span>0</span>
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent">
                      종료 <span>0</span>
                    </button>
                  </nav>
                </div>

                {/* 프로젝트 컨텐츠 */}
                <div className="flex-1 overflow-y-auto">
                  <div className="h-full flex flex-col items-center justify-center p-6">
                    <div className="w-12 h-12 mb-4">
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gray-200">
                        <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth={2} />
                        <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">현재 진행중인 프로젝트가 없어요.</p>
                    <button className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                      프로젝트에 투입하기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 공통 하단 버튼 */}
            <div className="flex-none px-4 py-4 bg-white border-t border-gray-200">
              <button
                type="submit"
                form="workerForm"
                className="w-full flex justify-center py-3 px-4 border border-black rounded-md shadow-sm text-sm font-medium text-white bg-[#4E49E7] hover:bg-[#3F3ABE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E49E7]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 