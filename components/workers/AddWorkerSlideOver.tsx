'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { WorkerJobType, WorkerLevelType } from '@/types/worker'

interface AddWorkerSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function AddWorkerSlideOver({ isOpen, onClose, onSubmit }: AddWorkerSlideOverProps) {
  const [name, setName] = useState('')
  const [jobType, setJobType] = useState<WorkerJobType>('기획')
  const [level, setLevel] = useState<WorkerLevelType>('초급')
  const [price, setPrice] = useState('')
  const [isDispatched, setIsDispatched] = useState(false)

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
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* 헤더 */}
              <div className="px-4 py-6 bg-gray-50 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">실무자 등록</h2>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* 폼 */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* 이름 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이름</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                        required
                      />
                    </div>

                    {/* 직무 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">직무</label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value as WorkerJobType)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                      >
                        {jobTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* 등급 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">등급</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value as WorkerLevelType)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                      >
                        {levels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    {/* 단가 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">단가</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => setPrice(formatPrice(e.target.value))}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">원</span>
                        </div>
                      </div>
                    </div>

                    {/* 파견 여부 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isDispatched}
                        onChange={(e) => setIsDispatched(e.target.checked)}
                        className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        파견중
                      </label>
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-black rounded-md shadow-sm text-sm font-medium text-white bg-[#4E49E7] hover:bg-[#3F3ABE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E49E7]"
                    >
                      등록하기
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 