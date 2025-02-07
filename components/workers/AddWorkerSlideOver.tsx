'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ArrowLeft, Trash2 } from 'lucide-react'
import type { Worker, WorkerJobType, WorkerLevelType, WorkerMMRecord } from '@/types/worker'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface InputEvent extends Event {
  isComposing: boolean;
}

interface CustomError {
  message?: string;
}

interface AddWorkerSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  onDelete: (worker?: Worker) => Promise<void>
  isEdit?: boolean
  workerId?: string
  worker?: Worker | null
}

export default function AddWorkerSlideOver({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  isEdit = false,
  workerId,
  worker 
}: AddWorkerSlideOverProps) {
  const [name, setName] = useState(worker?.name || '')
  const [jobType, setJobType] = useState<WorkerJobType | ''>(worker?.job_type || '')
  const [level, setLevel] = useState<WorkerLevelType | ''>(worker?.level || '')
  const [price, setPrice] = useState(worker?.price ? worker.price.toLocaleString() : '')
  const [isDispatched, setIsDispatched] = useState<boolean | null>(worker?.is_dispatched ?? null)
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false)
  const [isLevelOpen, setIsLevelOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)
  const [tempPrice, setTempPrice] = useState('')
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [mmRecords, setMMRecords] = useState<WorkerMMRecord[]>([])
  const currentYear = new Date().getFullYear()
  const [loading, setLoading] = useState(false)

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발']
  const levels: WorkerLevelType[] = ['초급', '중급', '고급']

  // 드롭박스 ref 추가
  const jobTypeRef = useRef<HTMLDivElement>(null)
  const levelRef = useRef<HTMLDivElement>(null)
  const priceRef = useRef<HTMLDivElement>(null)
  const dispatchRef = useRef<HTMLDivElement>(null)

  // body 스크롤 제어
  useEffect(() => {
    const body = document.body;
    if (isOpen) {
      body.classList.add('lock');
    } else {
      body.classList.remove('lock');
    }

    return () => {
      body.classList.remove('lock');
    };
  }, [isOpen]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobTypeRef.current && !jobTypeRef.current.contains(event.target as Node)) {
        setIsJobTypeOpen(false)
      }
      if (levelRef.current && !levelRef.current.contains(event.target as Node)) {
        setIsLevelOpen(false)
      }
      if (priceRef.current && !priceRef.current.contains(event.target as Node)) {
        setIsPriceOpen(false)
      }
      if (dispatchRef.current && !dispatchRef.current.contains(event.target as Node)) {
        setIsDispatchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // worker 데이터가 변경될 때마다 form 값 업데이트
  useEffect(() => {
    if (worker) {
      setName(worker.name)
      setJobType(worker.job_type || '')
      setLevel(worker.level || '')
      setPrice(worker.price ? worker.price.toLocaleString() : '')
      setIsDispatched(worker.is_dispatched)
    } else {
      // 새로운 실무자 추가 시 초기화
      setName('')
      setJobType('')
      setLevel('')
      setPrice('')
      setIsDispatched(false)
    }
  }, [worker])

  // M/M 기록 가져오기
  useEffect(() => {
    const fetchMMRecords = async () => {
      if (workerId) {
        const { data, error } = await supabase
          .from('worker_mm_records')
          .select('*')
          .eq('worker_id', workerId)
          .eq('year', currentYear)

        if (!error && data) {
          setMMRecords(data)
        }
      } else {
        setMMRecords([])
      }
    }

    fetchMMRecords()
  }, [workerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 1. 기본 유효성 검사 (기존 코드 유지)
      if (!name) {
        toast.error('이름을 입력해주세요.')
        return
      }

      if (name.length > 100) {
        toast.error('이름은 최대 100자까지 입력 가능합니다.')
        return
      }

      const nameRegex = /^[가-힣a-zA-Z0-9\s_()（）[\]｛｝《》〈〉「」『』【】]+$/
      if (!nameRegex.test(name)) {
        toast.error('특수문자는 입력할 수 없습니다.')
        return
      }

      let finalName = name
      let hasNameConflict = false

      // 동명이인 체크 (수정 모드이거나 새로 추가할 때)
      if (!isEdit || (isEdit && worker && name !== worker.name)) {
        // 동일한 이름의 실무자들 조회 (기본 이름 + 넘버링된 이름 모두 검색)
        const { data: existingWorkers, error: searchError } = await supabase
          .from('workers')
          .select('id, name, created_at')
          .or(`name.eq.${name},name.like.${name}_%`)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })

        if (searchError) {
          console.error('Error searching workers:', searchError)
          toast.error('실무자 정보 확인 중 오류가 발생했습니다.')
          return
        }

        // 동명이인이 있는 경우 처리
        if (existingWorkers && existingWorkers.length > 0) {
          hasNameConflict = true
          
          // 현재 사용 중인 가장 큰 넘버링 찾기
          let maxNumber = 0
          existingWorkers.forEach(worker => {
            const match = worker.name.match(new RegExp(`${name}_(\\d+)$`))
            if (match) {
              const num = parseInt(match[1])
              maxNumber = Math.max(maxNumber, num)
            }
          })

          // 기존 넘버링이 없는 이름이 있다면 먼저 처리
          const originalName = existingWorkers.find(w => w.name === name)
          if (originalName) {
            const { error: updateError } = await supabase
              .from('workers')
              .update({ name: `${name}_1` })
              .eq('id', originalName.id)

            if (updateError) {
              console.error('Error updating existing worker:', updateError)
              toast.error('실무자 정보 업데이트 중 오류가 발생했습니다.')
              return
            }
            maxNumber = Math.max(maxNumber, 1)
          }

          // 새로운 이름에 다음 번호 부여
          finalName = `${name}_${maxNumber + 1}`
        }
      }

      // 3. 실무자 정보 업데이트
      const workerData = {
        name: finalName,
        job_type: jobType as WorkerJobType || null,
        level: level as WorkerLevelType || null,
        price: price ? parseInt(price.replace(/,/g, '')) : null,
        is_dispatched: isDispatched ?? false
      }

      onSubmit({ 
        worker: workerData,
        mmRecords 
      })

      // 4. 성공 메시지
      if (hasNameConflict) {
        toast.success('목록에 동명이인이 있어 넘버링이 추가 되었습니다.')
      }

      onClose()
    } catch (error: unknown) {
      console.error('Error:', error)
      const customError = error as CustomError
      toast.error(customError?.message || '저장 중 오류가 발생했습니다.')
    }
  }

  // 이름 입력 시 실시간 유효성 검사
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // 입력 중에는 모든 값을 허용
    setName(value)
    
    // 입력이 완료된 상태에서만 검사 (한글 입력 중이 아닐 때)
    const nativeEvent = e.nativeEvent as InputEvent
    if (!nativeEvent.isComposing) {
      // 특수문자 검사 (한글, 영문, 숫자, 공백, 괄호, 밑줄만 허용)
      const nameRegex = /^[가-힣a-zA-Z0-9\s_()（）[\]｛｝《》〈〉「」『』【】]*$/
      if (value && !nameRegex.test(value)) {
        toast.error('특수문자는 입력할 수 없습니다.')
        return
      }

      // 길이 검사
      if (value.length > 100) {
        toast.error('이름은 최대 100자까지 입력 가능합니다.')
        return
      }
    }
  }

  const handleDelete = async () => {
    if (!workerId) return
    
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      setLoading(true)
      toast.loading('삭제 중...')

      // 기존 삭제 로직 실행 (confirm 없이)
      await onDelete(worker)
      
      // 성공 처리는 onDelete 내부에서 처리되므로 여기서는 닫기만 실행
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.dismiss()
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (value: string) => {
    const number = value.replace(/[^0-9]/g, '')
    return number ? parseInt(number).toLocaleString() : ''
  }

  const addPrice = (amount: number) => {
    const currentPrice = parseInt(tempPrice.replace(/,/g, '') || '0')
    setTempPrice(formatPrice((currentPrice + amount).toString()))
  }

  const updateMMValue = (month: number, value: number) => {
    setMMRecords((prev: WorkerMMRecord[]) => {
      const existing = prev.find(r => r.month === month && r.year === currentYear)
      if (existing) {
        return prev.map(r => 
          r.month === month && r.year === currentYear 
            ? { ...r, mm_value: value }
            : r
        )
      }
      return [...prev, { year: currentYear, month, mm_value: value, worker_id: workerId || '' }]
    })
  }

  return (
    <div className={`fixed inset-0 overflow-hidden z-50 ${!isOpen && 'pointer-events-none'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={onClose}
        />

        <div className={`fixed inset-y-0 right-0 max-w-full flex transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="w-screen max-w-[1200px]">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="sm:hidden flex-none px-4 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">실무자 {isEdit ? '수정' : '추가'}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="hidden sm:block flex-none px-2 py-2 bg-gray-50 sm:px-6 border-b border-gray-200">
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
                    {isEdit && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-3 py-1.5 text-sm font-medium text-black bg-white hover:text-white border border-grey rounded-md hover:bg-red-600 transition-colors duration-200"
                      >
                        삭제하기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-sm font-medium text-black bg-white hover:text-white border border-grey rounded-md hover:bg-gray-600 transition-colors duration-200"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="w-[720px] flex flex-col bg-white">
                  <form id="workerForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="px-8 pt-6 pb-4">
                      <div className="flex items-center text-[14px] text-[#4E49E7]">
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

                    <div className="flex-1 px-8 space-y-8">
                      <div className="space-y-8">
                        <div>
                          <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            maxLength={100}
                            className="block w-full text-[38px] font-bold px-0 border-0 focus:ring-0 focus:border-gray-900"
                            placeholder="이름을 입력하세요"
                          />
                        </div>

                        <div>
                          <div className="relative" ref={jobTypeRef}>
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

                        <div>
                          <div className="relative" ref={levelRef}>
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

                        <div>
                          <div className="relative" ref={priceRef}>
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

                            {isPriceOpen && (
                              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 p-4">
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

                        <div>
                          <div className="relative" ref={dispatchRef}>
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

                      <div className="border-t border-gray-200 pt-6">
                        <div className="mb-8">
                          <h3 className="text-[14px] font-medium text-gray-900 mb-4">월간 M/M 투입 금액</h3>
                          <div className="flex flex-col items-center">
                            <div className="w-[200px] h-[200px] mb-4">
                              <Doughnut
                                data={{
                                  labels: ['투입', '미투입'],
                                  datasets: [{
                                    data: [
                                      mmRecords.reduce((sum, record) => sum + (record.mm_value || 0), 0),
                                      12 - mmRecords.reduce((sum, record) => sum + (record.mm_value || 0), 0)
                                    ],
                                    backgroundColor: [
                                      '#4E49E7',
                                      '#E5E7EB'
                                    ],
                                    borderWidth: 0
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: true,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  cutout: '70%'
                                }}
                              />
                            </div>
                            <div className="text-center">
                              <div className="text-[14px] text-gray-500 mb-2">총 투입</div>
                              <div className="text-[24px] font-bold text-[#4E49E7]">
                                {mmRecords.reduce((sum, record) => sum + (record.mm_value || 0), 0).toLocaleString()}
                                <span className="text-[14px] font-normal ml-1">만원</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[14px] font-medium text-gray-900 mb-4">
                            {currentYear}년 M/M 투입 추이
                          </h3>
                          
                          <div className="h-[200px] mb-6">
                            <Line
                              data={{
                                labels: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
                                datasets: [{
                                  label: '월별 M/M',
                                  data: Array.from({ length: 12 }, (_, i) => {
                                    const record = mmRecords.find(r => r.month === i + 1)
                                    return record?.mm_value || 0
                                  }),
                                  borderColor: '#4E49E7',
                                  backgroundColor: 'rgba(78, 73, 231, 0.1)',
                                  tension: 0.4,
                                  fill: true
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    display: false
                                  }
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: value => `${value}만원`
                                    }
                                  }
                                }
                              }}
                            />
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-[14px]">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-4 py-2 border">구분</th>
                                  <th className="px-4 py-2 border">1월</th>
                                  <th className="px-4 py-2 border">2월</th>
                                  <th className="px-4 py-2 border">3월</th>
                                  <th className="px-4 py-2 border">분기 합계</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[1, 2, 3, 4].map((quarter) => (
                                  <tr key={quarter}>
                                    <td className="px-4 py-2 border font-medium">{quarter}분기</td>
                                    {[0, 1, 2].map((monthOffset) => {
                                      const month = (quarter - 1) * 3 + monthOffset + 1;
                                      const record = mmRecords.find(r => r.month === month)
                                      return (
                                        <td key={month} className="px-4 py-2 border text-center">
                                          {record?.mm_value?.toLocaleString() || '0'}
                                        </td>
                                      );
                                    })}
                                    <td className="px-4 py-2 border text-center font-medium">
                                      {mmRecords
                                        .filter(r => Math.ceil(r.month / 3) === quarter)
                                        .reduce((sum, record) => sum + (record.mm_value || 0), 0)
                                        .toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50">
                                  <td className="px-4 py-2 border font-medium">{currentYear}년 합계</td>
                                  <td className="px-4 py-2 border text-center font-medium" colSpan={4}>
                                    {mmRecords.reduce((sum, record) => sum + (record.mm_value || 0), 0).toLocaleString()}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="flex-1 flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
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

              <div className="flex-none px-4 py-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  {isEdit && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="sm:hidden flex-1 py-3 px-4 text-[14px] font-medium text-red-600 bg-white border border-red-600 hover:bg-red-50 rounded-lg"
                    >
                      삭제
                    </button>
                  )}
                  <button
                    type="submit"
                    form="workerForm"
                    className="flex-1 py-3 px-4 text-[14px] font-medium text-white bg-[#4E49E7] hover:bg-[#3F3ABE] rounded-lg"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 