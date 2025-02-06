'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, Trash2 } from 'lucide-react'
import type { WorkerJobType, WorkerLevelType, WorkerMMRecord } from '@/types/worker'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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
  const [mmRecords, setMMRecords] = useState<WorkerMMRecord[]>([])
  const currentYear = new Date().getFullYear()

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발']
  const levels: WorkerLevelType[] = ['초급', '중급', '고급']

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 기존 worker 데이터 저장
    const workerData = {
      name,
      job_type: jobType,
      level,
      price: parseInt(price.replace(/,/g, '')),
      is_dispatched: isDispatched
    }

    // M/M 기록 데이터 준비
    const mmData = mmRecords.map(record => ({
      worker_id: workerId, // 새로 생성된 worker의 ID
      year: record.year,
      month: record.month,
      mm_value: record.mm_value
    }))

    onSubmit({ worker: workerData, mmRecords: mmData })
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
    setMMRecords(prev => {
      const existing = prev.find(r => r.month === month && r.year === currentYear)
      if (existing) {
        return prev.map(r => 
          r.month === month && r.year === currentYear 
            ? { ...r, mm_value: value }
            : r
        )
      }
      return [...prev, { year: currentYear, month, mm_value: value }]
    })
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
          <div className="w-[1200px] flex flex-col">
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
              {/* 폼 영역 - 너비 증가 및 여백 조정 */}
              <div className="w-[720px] flex flex-col bg-white overflow-y-auto slide-over-scroll">
                <form id="workerForm" onSubmit={handleSubmit} className="flex-1">
                  {/* 실무자 정보 영역 */}
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
                    {/* 기본 정보 영역 */}
                    <div className="space-y-8">
                      {/* 이름 */}
                      <div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border-0 border-b-2 border-transparent bg-transparent text-[18px] font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0"
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

                    {/* M/M 투입 추이 섹션 */}
                    <div className="space-y-8 pb-8">
                      {/* 월간 M/M 투입 금액 */}
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">월간 M/M 투입 금액</h3>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold">
                            M/M 대비 +0
                            <span className="text-base font-normal text-gray-500 ml-2">원</span>
                          </div>
                        </div>
                      </div>

                      {/* M/M 투입 추이 그래프 */}
                      <div className="border rounded-lg p-6">
                        <h3 className="text-[18px] font-medium mb-6">{currentYear}년 M/M 투입 추이</h3>
                        <div className="h-[200px] mb-8">
                          <Line
                            data={{
                              labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                              datasets: [{
                                label: 'M/M',
                                data: Array.from({ length: 12 }, (_, i) => 
                                  mmRecords.find(r => r.month === i + 1)?.mm_value || 0
                                ),
                                borderColor: '#4E49E7',
                                backgroundColor: '#4E49E7',
                                tension: 0.4
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 1
                                }
                              }
                            }}
                          />
                        </div>

                        {/* M/M 투입 테이블 */}
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
                                    return (
                                      <td key={month} className="px-4 py-2 border text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max="1"
                                          step="0.1"
                                          value={mmRecords.find(r => r.month === month)?.mm_value || 0}
                                          onChange={(e) => updateMMValue(month, parseFloat(e.target.value))}
                                          className="w-16 text-center border rounded px-1"
                                        />
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-2 border text-center font-medium">
                                    {(mmRecords
                                      .filter(r => Math.ceil(r.month / 3) === quarter)
                                      .reduce((sum, record) => sum + record.mm_value, 0)
                                    ).toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td className="px-4 py-2 border font-medium">연간 합계</td>
                                <td className="px-4 py-2 border text-center" colSpan={3}>
                                  {mmRecords.reduce((sum, record) => sum + record.mm_value, 0).toFixed(1)}
                                </td>
                                <td className="px-4 py-2 border"></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* 프로젝트 영역 - 남은 공간 사용 */}
              <div className="flex-1 flex flex-col bg-white border-l border-gray-200 overflow-y-auto slide-over-scroll">
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
                className="w-full py-3 px-4 text-[14px] font-medium text-white bg-[#4E49E7] hover:bg-[#3F3ABE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E49E7]"
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