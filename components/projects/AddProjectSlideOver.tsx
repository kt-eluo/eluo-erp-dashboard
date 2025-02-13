'use client'

import { useState, Fragment, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ArrowLeft, ChevronDown, Calendar } from 'lucide-react'
import { ProjectStatus } from '@/types/project'
import { toast } from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'

interface AddProjectSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: any) => void
}

// 스타일 추가
const datePickerWrapperStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
`

// 모든 input에 적용할 공통 스타일 (프로젝트명 입력 제외)
const commonInputStyles = `
  .form-input:not([placeholder="프로젝트명을 입력하세요"]) {
    outline: none !important;
    box-shadow: none !important;
  }
  input:not([placeholder="프로젝트명을 입력하세요"]):focus {
    outline: none !important;
    box-shadow: none !important;
  }
  .react-datepicker__input-container input {
    outline: none !important;
    box-shadow: none !important;
  }
`

export default function AddProjectSlideOver({
  isOpen,
  onClose,
  onSubmit
}: AddProjectSlideOverProps) {
  // 기본 정보
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [majorCategory, setMajorCategory] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  
  // 계약 정보
  const [contractAmount, setContractAmount] = useState('')
  const [isVatIncluded, setIsVatIncluded] = useState(false)
  const [commonExpense, setCommonExpense] = useState('')
  const [contractType, setContractType] = useState<'milestone' | 'periodic'>('milestone')
  
  // 회차 정산형 정보
  const [downPayment, setDownPayment] = useState('')  // 착수금
  const [intermediatePayments, setIntermediatePayments] = useState<string[]>(['']) // 중도금
  const [finalPayment, setFinalPayment] = useState('') // 잔금
  
  // 정기 결제형 정보
  const [periodicUnit, setPeriodicUnit] = useState<'month' | 'week'>('month')
  const [periodicInterval, setPeriodicInterval] = useState('')
  const [periodicAmount, setPeriodicAmount] = useState('')

  // 드롭다운 상태 추가
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isMajorCategoryOpen, setIsMajorCategoryOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isContractTypeOpen, setIsContractTypeOpen] = useState(false)
  const [isPeriodicUnitOpen, setIsPeriodicUnitOpen] = useState(false)

  // refs 추가
  const statusRef = useRef<HTMLDivElement>(null)
  const majorCategoryRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const contractTypeRef = useRef<HTMLDivElement>(null)
  const periodicUnitRef = useRef<HTMLDivElement>(null)

  // 달력 표시 상태 추가
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const majorCategories = ['운영', '구축', '개발', '기타']
  const categories = ['금융', '커머스', 'AI', '기타'] // 예시 카테고리
  const statusTypes: ProjectStatus[] = ['준비중', '진행중', '완료', '보류']

  // 외부 클릭 감지 useEffect 추가
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false)
      }
      if (majorCategoryRef.current && !majorCategoryRef.current.contains(event.target as Node)) {
        setIsMajorCategoryOpen(false)
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false)
      }
      if (contractTypeRef.current && !contractTypeRef.current.contains(event.target as Node)) {
        setIsContractTypeOpen(false)
      }
      if (periodicUnitRef.current && !periodicUnitRef.current.contains(event.target as Node)) {
        setIsPeriodicUnitOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 기본 유효성 검사
      if (!title.trim()) {
        toast.error('프로젝트 제목을 입력해주세요.')
        return
      }

      // 데이터 포맷팅
      const projectData = {
        title,
        status,
        major_category: majorCategory,
        category,
        start_date: startDate ? startDate.toISOString().split('T')[0] : null,
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        contract_amount: contractAmount ? parseInt(contractAmount.replace(/,/g, '')) : null,
        is_vat_included: isVatIncluded,
        common_expense: commonExpense ? parseInt(commonExpense.replace(/,/g, '')) : null,
        contract_type: contractType,
        contract_details: contractType === 'milestone' 
          ? {
              down_payment: downPayment ? parseInt(downPayment.replace(/,/g, '')) : null,
              intermediate_payments: intermediatePayments.map(p => p ? parseInt(p.replace(/,/g, '')) : null),
              final_payment: finalPayment ? parseInt(finalPayment.replace(/,/g, '')) : null,
            }
          : {
              periodic_unit: periodicUnit,
              periodic_interval: periodicInterval ? parseInt(periodicInterval) : null,
              periodic_amount: periodicAmount ? parseInt(periodicAmount.replace(/,/g, '')) : null,
            }
      }

      onSubmit(projectData)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('프로젝트 추가 중 오류가 발생했습니다.')
    }
  }

  const handleAddIntermediatePayment = () => {
    setIntermediatePayments([...intermediatePayments, ''])
  }

  const handleRemoveIntermediatePayment = (index: number) => {
    setIntermediatePayments(intermediatePayments.filter((_, i) => i !== index))
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      {/* 스타일 태그 추가 */}
      <style>
        {datePickerWrapperStyles}
        {commonInputStyles}
      </style>
      
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

            <div className="fixed inset-0 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <Transition.Child
                    as={Fragment}
                    enter="transform transition ease-in-out duration-500"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-500"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <Dialog.Panel className="pointer-events-auto w-screen max-w-6xl">
                      <div className="flex h-full flex-col overflow-y-scroll bg-white">
                        {/* 헤더 */}
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

                    {/* 본문 */}
                    <div className="flex flex-1">
                      {/* 왼쪽: 입력 폼 */}
                      <div className="w-2/3 border-r border-gray-200">
                        <form id="projectForm" onSubmit={handleSubmit}>
                          {/* 프로젝트 아이콘과 텍스트 */}
                          <div className="px-6 pt-6">
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                />
                              </svg>
                              프로젝트
                            </div>
                          </div>

                          <div className="px-4 py-6 sm:px-6 space-y-6">
                            {/* 프로젝트명 입력 */}
                            <div>
                              <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                                className="block w-full text-[38px] font-bold px-0 border-0 focus:ring-0 focus:border-gray-900"
                                placeholder="프로젝트명을 입력하세요"
                              />
                            </div>

                            {/* 기본 정보 섹션 */}
                            <div>
                              <div className="mt-6 space-y-6">
                                {/* 상태 선택 */}
                                <div className="relative" ref={statusRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                                    className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                                  >
                                    <span className={status ? 'text-gray-900' : 'text-gray-400'}>
                                      {status || '상태'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  
                                  {isStatusOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {statusTypes.map((type) => (
                                        <button
                                          key={type}
                                          type="button"
                                          onClick={() => {
                                            setStatus(type)
                                            setIsStatusOpen(false)
                                          }}
                                          className={`${
                                            status === type ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                          } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                        >
                                          {type}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* 대분류 선택 */}
                                <div className="relative" ref={majorCategoryRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsMajorCategoryOpen(!isMajorCategoryOpen)}
                                    className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                                  >
                                    <span className={majorCategory ? 'text-gray-900' : 'text-gray-400'}>
                                      {majorCategory || '대분류'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMajorCategoryOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  
                                  {isMajorCategoryOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {majorCategories.map((cat) => (
                                        <button
                                          key={cat}
                                          type="button"
                                          onClick={() => {
                                            setMajorCategory(cat)
                                            setIsMajorCategoryOpen(false)
                                          }}
                                          className={`${
                                            majorCategory === cat ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                          } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* 세부 카테고리 선택 */}
                                <div className="relative" ref={categoryRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                                  >
                                    <span className={category ? 'text-gray-900' : 'text-gray-400'}>
                                      {category || '카테고리'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  
                                  {isCategoryOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      {categories.map((cat) => (
                                        <button
                                          key={cat}
                                          type="button"
                                          onClick={() => {
                                            setCategory(cat)
                                            setIsCategoryOpen(false)
                                          }}
                                          className={`${
                                            category === cat ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                          } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-6">
                                  {/* 시작일 선택 */}
                                  <div className="relative w-full">
                                    <DatePicker
                                      selected={startDate}
                                      onChange={(date: Date) => setStartDate(date)}
                                      locale={ko}
                                      dateFormat="yyyy년 MM월 dd일"
                                      placeholderText="시작일"
                                      showMonthDropdown
                                      showYearDropdown
                                      dropdownMode="select"
                                      popperPlacement="bottom-end"
                                      customInput={
                                        <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                          <input
                                            type="text"
                                            value={startDate ? startDate.toLocaleDateString('ko-KR', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            }) : ''}
                                            readOnly
                                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                            placeholder="시작일"
                                          />
                                          <Calendar className="w-5 h-5 text-gray-400 ml-auto cursor-pointer" />
                                        </div>
                                      }
                                    />
                                  </div>

                                  {/* 종료일 선택 */}
                                  <div className="relative w-full">
                                    <DatePicker
                                      selected={endDate}
                                      onChange={(date: Date) => setEndDate(date)}
                                      locale={ko}
                                      dateFormat="yyyy년 MM월 dd일"
                                      placeholderText="종료일"
                                      minDate={startDate}
                                      showMonthDropdown
                                      showYearDropdown
                                      dropdownMode="select"
                                      popperPlacement="bottom-end"
                                      customInput={
                                        <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                          <input
                                            type="text"
                                            value={endDate ? endDate.toLocaleDateString('ko-KR', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            }) : ''}
                                            readOnly
                                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                            placeholder="종료일"
                                          />
                                          <Calendar className="w-5 h-5 text-gray-400 ml-auto cursor-pointer" />
                                        </div>
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 계약 정보 섹션 */}
                            <div className="pt-8 border-t border-gray-200">
                              <div className="flex items-center text-[14px] text-[#4E49E7] mb-6">
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
                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                                  />
                                </svg>
                                계약 정보
                              </div>

                              <div className="space-y-8">
                                {/* 계약 금액 */}
                                <div className="relative">
                                  <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                    <input
                                      type="text"
                                      value={contractAmount}
                                      onChange={(e) => {
                                        // 숫자와 쉼표를 제외한 모든 문자 제거
                                        let value = e.target.value.replace(/[^\d,]/g, '')
                                        
                                        // 쉼표 제거
                                        value = value.replace(/,/g, '')
                                        
                                        if (value) {
                                          try {
                                            // 천단위 쉼표 추가
                                            const formattedValue = Number(value).toLocaleString()
                                            setContractAmount(formattedValue)
                                          } catch (error) {
                                            setContractAmount(value)
                                          }
                                        } else {
                                          setContractAmount('')
                                        }
                                      }}
                                      className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                      placeholder="계약 금액"
                                    />
                                    <span className="text-gray-400 ml-2 flex-shrink-0">원</span>
                                    <div className="ml-4 flex items-center gap-1.5 flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={isVatIncluded}
                                        onChange={(e) => setIsVatIncluded(e.target.checked)}
                                        className="rounded border-gray-300 text-[#4E49E7] focus:ring-0 w-4 h-4"
                                      />
                                      <span className="text-[13px] text-gray-500 whitespace-nowrap">VAT 포함</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 계약 유형 */}
                                <div className="relative" ref={contractTypeRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsContractTypeOpen(!isContractTypeOpen)}
                                    className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                                  >
                                    <span className="text-gray-400">
                                      {contractType === 'milestone' ? '회차 정산형' : '정기 결제형'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isContractTypeOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  
                                  {isContractTypeOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setContractType('milestone')
                                          setIsContractTypeOpen(false)
                                        }}
                                        className={`${
                                          contractType === 'milestone' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                      >
                                        회차 정산형
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setContractType('periodic')
                                          setIsContractTypeOpen(false)
                                        }}
                                        className={`${
                                          contractType === 'periodic' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                      >
                                        정기 결제형
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 계약 유형별 추가 필드 */}
                                {contractType === 'milestone' ? (
                                  <div className="space-y-8">
                                    {/* 착수금 */}
                                    <div className="relative">
                                      <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                        <input
                                          type="text"
                                          value={downPayment}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/[^\d,]/g, '')
                                            const number = parseInt(value.replace(/,/g, ''))
                                            if (!isNaN(number)) {
                                              setDownPayment(number.toLocaleString())
                                            } else {
                                              setDownPayment('')
                                            }
                                          }}
                                          className="w-full bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                          placeholder="착수금"
                                        />
                                        <span className="text-gray-400 ml-2">원</span>
                                      </div>
                                    </div>

                                    {/* 중도금 */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-400">중도금</span>
                                        <button
                                          type="button"
                                          onClick={handleAddIntermediatePayment}
                                          className="text-sm text-[#4E49E7] hover:text-[#3F3ABE]"
                                        >
                                          + 차수 추가
                                        </button>
                                      </div>
                                      {intermediatePayments.map((payment, index) => (
                                        <div key={index} className="relative">
                                          <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                            <input
                                              type="text"
                                              value={payment}
                                              onChange={(e) => {
                                                const value = e.target.value.replace(/[^\d,]/g, '')
                                                const number = parseInt(value.replace(/,/g, ''))
                                                const newPayments = [...intermediatePayments]
                                                newPayments[index] = !isNaN(number) ? number.toLocaleString() : ''
                                                setIntermediatePayments(newPayments)
                                              }}
                                              className="w-full bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                              placeholder={`${index + 1}차 중도금`}
                                            />
                                            <span className="text-gray-400 ml-2">원</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveIntermediatePayment(index)}
                                              className="ml-2 text-gray-400 hover:text-gray-500"
                                            >
                                              <X className="h-5 w-5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* 잔금 */}
                                    <div className="relative">
                                      <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                        <input
                                          type="text"
                                          value={finalPayment}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/[^\d,]/g, '')
                                            const number = parseInt(value.replace(/,/g, ''))
                                            if (!isNaN(number)) {
                                              setFinalPayment(number.toLocaleString())
                                            } else {
                                              setFinalPayment('')
                                            }
                                          }}
                                          className="w-full bg-transparent border-0 focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                          placeholder="잔금"
                                        />
                                        <span className="text-gray-400 ml-2">원</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-8">
                                    {/* 정기 결제형 필드들 */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">결제 주기</label>
                                        <div className="relative" ref={periodicUnitRef}>
                                          <button
                                            type="button"
                                            onClick={() => setIsPeriodicUnitOpen(!isPeriodicUnitOpen)}
                                            className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                                          >
                                            <span className={periodicUnit ? 'text-gray-900' : 'text-gray-400'}>
                                              {periodicUnit ? (periodicUnit === 'month' ? '월' : '주') : '결제 주기 선택'}
                                            </span>
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isPeriodicUnitOpen ? 'rotate-180' : ''}`} />
                                          </button>
                                          
                                          {isPeriodicUnitOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setPeriodicUnit('month')
                                                  setIsPeriodicUnitOpen(false)
                                                }}
                                                className={`${
                                                  periodicUnit === 'month' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                              >
                                                월
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setPeriodicUnit('week')
                                                  setIsPeriodicUnitOpen(false)
                                                }}
                                                className={`${
                                                  periodicUnit === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                                } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                              >
                                                주
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">간격</label>
                                        <input
                                          type="number"
                                          value={periodicInterval}
                                          onChange={(e) => setPeriodicInterval(e.target.value)}
                                          min="1"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4E49E7] focus:ring-[#4E49E7] sm:text-sm"
                                          placeholder="1"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">결제 금액</label>
                                      <div className="mt-1 relative rounded-md shadow-sm">
                                        <input
                                          type="text"
                                          value={periodicAmount}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/[^\d,]/g, '')
                                            const number = parseInt(value.replace(/,/g, ''))
                                            if (!isNaN(number)) {
                                              setPeriodicAmount(number.toLocaleString())
                                            } else {
                                              setPeriodicAmount('')
                                            }
                                          }}
                                          className="block w-full rounded-md border-gray-300 pr-12 focus:border-[#4E49E7] focus:ring-[#4E49E7] sm:text-sm"
                                          placeholder="0"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                          <span className="text-gray-500 sm:text-sm">원</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 공통 경비 */}
                                <div className="relative">
                                  <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                    <input
                                      type="text"
                                      value={commonExpense}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d]/g, '')
                                        if (value) {
                                          const number = parseInt(value)
                                          setCommonExpense(number.toLocaleString())
                                        } else {
                                          setCommonExpense('')
                                        }
                                      }}
                                      className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
                                      placeholder="공통 경비"
                                    />
                                    <span className="text-gray-400 ml-2">원</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 하단 버튼 */}
                          <div className="flex-none px-4 py-4 bg-white border-t border-gray-200">
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                form="projectForm"
                                className="flex-1 py-3 px-4 text-[14px] font-medium text-white bg-[#4E49E7] hover:bg-[#3F3ABE] rounded-lg"
                              >
                                추가
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* 오른쪽: 프로젝트 정보 */}
                      <div className="w-1/3 bg-white">
                        <div className="px-4 py-6 sm:px-6">
                          <div className="border-b border-gray-200">
                            <nav className="flex space-x-8">
                              <button className="border-b-2 border-[#4E49E7] py-4 px-1 text-sm font-medium text-[#4E49E7]">
                                프로젝트 정보
                              </button>
                            </nav>
                          </div>
                          <div className="mt-6">
                            {/* 프로젝트 요약 정보 표시 */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 