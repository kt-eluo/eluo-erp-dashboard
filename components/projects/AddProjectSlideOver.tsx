'use client'

import { useState, Fragment, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ArrowLeft, ChevronDown, Calendar, Search } from 'lucide-react'
import type { Project, ProjectStatus, ProjectCategory, ProjectMajorCategory, ContractType, PeriodicUnit, ProjectRole, ManpowerSummary } from '@/types/project'
import { toast } from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'
import AddManpowerModal from './AddManpowerModal'
import { supabase } from '@/lib/supabase'

interface AddProjectSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: any) => void
  project?: Project | null
  mode?: 'create' | 'edit'
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

// DatePicker minDate 타입 에러 수정을 위한 타입 가드 함수 추가
const getMinDate = (date: Date | null): Date | undefined => {
  return date || undefined
}

// 상단에 Worker 타입 정의 추가
interface Worker {
  id: string
  name: string
  job_type: string
}

export default function AddProjectSlideOver({
  isOpen,
  onClose,
  onSubmit,
  project,
  mode = 'create'
}: AddProjectSlideOverProps) {
  // 기본 정보
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const [majorCategory, setMajorCategory] = useState<ProjectMajorCategory | ''>('')
  const [category, setCategory] = useState<ProjectCategory | ''>('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  
  // 계약 정보
  const [contractAmount, setContractAmount] = useState('')
  const [isVatIncluded, setIsVatIncluded] = useState(false)
  const [commonExpense, setCommonExpense] = useState('')
  const [contractType, setContractType] = useState<'회차 정산형' | '정기 결제형'>('회차 정산형')
  
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

  // 새로운 state 추가
  const [manpowerPlanning, setManpowerPlanning] = useState<number | null>(null)
  const [manpowerDesign, setManpowerDesign] = useState<number | null>(null)
  const [manpowerPublishing, setManpowerPublishing] = useState<number | null>(null)
  const [manpowerDevelopment, setManpowerDevelopment] = useState<number | null>(null)

  // 새로운 state 추가
  const [showManpowerButtons, setShowManpowerButtons] = useState(false)
  const [showManpowerModal, setShowManpowerModal] = useState(false)

  // client state 추가
  const [client, setClient] = useState('')
  // description state 추가
  const [description, setDescription] = useState('')

  // 상단에 state 추가
  const [isDuplicateName, setIsDuplicateName] = useState(false)

  // 컴포넌트 내부에 state 추가
  const [searchTerms, setSearchTerms] = useState<{[key: string]: string}>({
    'BD(BM)': '',
    'PM(PL)': '',
    '기획': '',
    '디자이너': '',
    '퍼블리셔': '',
    '개발': ''
  })

  const [selectedWorkers, setSelectedWorkers] = useState<{[key: string]: Array<{id: string, name: string}>}>({
    'BD(BM)': [],
    'PM(PL)': [],
    '기획': [],
    '디자이너': [],
    '퍼블리셔': [],
    '개발': []
  })

  const [workers, setWorkers] = useState<Worker[]>([])

  const majorCategories: ProjectMajorCategory[] = ['금융', '커머스', 'AI', '기타']
  const categories: ProjectCategory[] = ['운영', '구축', '개발', '기타']
  const statusTypes: ProjectStatus[] = ['준비중', '진행중', '완료', '보류']

  // 외부 클릭 감지 useEffect 수정
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 모달이 열려있을 때는 외부 클릭 감지를 하지 않음
      if (showManpowerModal) return;

      // 각 ref에 대한 클릭 감지 확인
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
  }, [showManpowerModal]) // showManpowerModal을 의존성 배열에 추가

  // 프로젝트 데이터로 폼 초기화
  useEffect(() => {
    if (project && mode === 'edit') {
      // 기본 정보
      setTitle(project.name)
      setClient(project.client || '')
      setDescription(project.description || '')
      
      // 날짜 정보
      setStartDate(project.start_date ? new Date(project.start_date) : null)
      setEndDate(project.end_date ? new Date(project.end_date) : null)
      
      // 카테고리 및 상태 정보
      setStatus(project.status || '')
      setMajorCategory(project.major_category || '')
      setCategory(project.category || '')
      
      // 직무별 전체 공수 정보 설정
      setManpowerPlanning(project.planning_manpower || null);
      setManpowerDesign(project.design_manpower || null);
      setManpowerPublishing(project.publishing_manpower || null);
      setManpowerDevelopment(project.development_manpower || null);

      // 직무별 실무자 정보 설정
      if (project.manpower) {
        const workersByRole: {[key: string]: Array<{id: string, name: string}>} = {
          'BD(BM)': [],
          'PM(PL)': [],
          '기획': [],
          '디자이너': [],
          '퍼블리셔': [],
          '개발': []
        };

        project.manpower.forEach(mp => {
          if (mp.worker_id && mp.role) {
            // workers 배열에서 해당 worker_id를 가진 worker 찾기
            const worker = workers.find(w => w.id === mp.worker_id);
            if (worker) {
              workersByRole[mp.role].push({
                id: worker.id,
                name: worker.name
              });
            }
          }
        });

        setSelectedWorkers(workersByRole);
      }

      // 계약 정보 설정
      if (project.contract_type) {
        setContractType(project.contract_type)
        setContractAmount(project.budget?.toString() || '')
        setIsVatIncluded(project.is_vat_included || false)
        setCommonExpense(project.common_expense?.toString() || '')

        if (project.contract_type === '회차 정산형') {
          setDownPayment(project.down_payment?.toString() || '')
          setIntermediatePayments(project.intermediate_payments?.map(p => p.toString()) || [''])
          setFinalPayment(project.final_payment?.toString() || '')
        } else if (project.contract_type === '정기 결제형') {
          setPeriodicUnit(project.periodic_unit || 'month')
          setPeriodicInterval(project.periodic_interval?.toString() || '')
          setPeriodicAmount(project.periodic_amount?.toString() || '')
        }
      }
    }
  }, [project, mode, workers]) // workers를 의존성 배열에 추가

  // 실무자 데이터 가져오기
  useEffect(() => {
    const fetchWorkers = async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, job_type')
        .is('deleted_at', null)
      
      if (error) {
        console.error('Error fetching workers:', error)
        return
      }
      
      if (data) setWorkers(data)
    }
    
    fetchWorkers()
  }, [])

  // 검색어에 맞는 실무자 필터링
  const getFilteredWorkers = (jobType: string) => {
    const searchTerm = searchTerms[jobType]
    return workers.filter(worker => 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // 실무자 선택 핸들러
  const handleWorkerSelect = (jobType: string, worker: { id: string, name: string }) => {
    setSelectedWorkers(prev => ({
      ...prev,
      [jobType]: [...prev[jobType], worker]
    }))
    setSearchTerms(prev => ({
      ...prev,
      [jobType]: ''
    }))
  }

  // 실무자 제거 핸들러
  const handleWorkerRemove = (jobType: string, workerId: string) => {
    setSelectedWorkers(prev => ({
      ...prev,
      [jobType]: prev[jobType].filter(w => w.id !== workerId)
    }))
  }

  // 중복 체크 함수 추가
  const checkDuplicateName = async (name: string) => {
    try {
      const { data: existingProjects, error } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', name.trim())
        
      if (error) throw error

      // 수정 모드일 때는 현재 프로젝트를 제외하고 체크
      if (mode === 'edit' && project?.id) {
        setIsDuplicateName(existingProjects.some(p => p.id !== project.id))
      } else {
        // 새로운 프로젝트 추가일 때
        setIsDuplicateName(existingProjects.length > 0)
      }
    } catch (error) {
      console.error('Error checking duplicate name:', error)
    }
  }

  // title state의 onChange 핸들러 수정
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    
    // 입력값이 있을 때만 중복 체크
    if (newTitle.trim()) {
      checkDuplicateName(newTitle)
    } else {
      setIsDuplicateName(false)
    }
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    // 프로젝트명만 필수 검사
    if (!title.trim()) errors.push('프로젝트명을 입력해주세요')

    // 계약 유형이 선택된 경우에만 관련 검사 수행
    if (contractType) {
      if (contractType === '회차 정산형' && contractAmount) {
        // 금액이 하나라도 입력된 경우에만 검사
        const hasAnyPayment = downPayment || intermediatePayments.some(p => p) || finalPayment || commonExpense

        if (hasAnyPayment) {
          const totalPayments = (downPayment ? parseInt(downPayment.replace(/,/g, '')) : 0) +
            intermediatePayments.reduce((sum, payment) => sum + (payment ? parseInt(payment.replace(/,/g, '')) : 0), 0) +
            (finalPayment ? parseInt(finalPayment.replace(/,/g, '')) : 0) +
            (commonExpense ? parseInt(commonExpense.replace(/,/g, '')) : 0)
          
          const totalBudget = parseInt(contractAmount.replace(/,/g, ''))

          if (totalPayments !== totalBudget) {
            errors.push('착수금, 중도금, 잔금, 공통경비의 합이 계약금액과 일치해야 합니다')
          }
        }
      }
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 프로젝트 데이터 준비
      const projectData = {
        name: title,
        client,
        description,
        start_date: startDate?.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        status: status || null,
        category: category || null,
        major_category: majorCategory || null,
        contract_type: contractType || null,
        is_vat_included: isVatIncluded,
        common_expense: commonExpense ? parseInt(commonExpense.replace(/,/g, '')) : null,
        budget: contractAmount ? parseInt(contractAmount.replace(/,/g, '')) : null,
        
        // 직무별 전체 공수 정보 추가
        planning_manpower: manpowerPlanning,
        design_manpower: manpowerDesign,
        publishing_manpower: manpowerPublishing,
        development_manpower: manpowerDevelopment,
        
        // 회차 정산형 정보
        down_payment: contractType === '회차 정산형' && downPayment ? 
          parseInt(downPayment.replace(/,/g, '')) : null,
        intermediate_payments: contractType === '회차 정산형' && intermediatePayments.length > 0 ? 
          intermediatePayments.map(payment => payment ? parseInt(payment.replace(/,/g, '')) : 0) : null,
        final_payment: contractType === '회차 정산형' && finalPayment ? 
          parseInt(finalPayment.replace(/,/g, '')) : null,
        
        // 정기 결제형 정보
        periodic_unit: contractType === '정기 결제형' ? periodicUnit : null,
        periodic_interval: contractType === '정기 결제형' && periodicInterval ? 
          parseInt(periodicInterval) : null,
        periodic_amount: contractType === '정기 결제형' && periodicAmount ? 
          parseInt(periodicAmount.replace(/,/g, '')) : null
      }

      let projectId: string | undefined;
      let successMessage = '';  // 성공 메시지 변수 추가

      if (mode === 'create') {
        // 새 프로젝트 생성
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert([projectData])
          .select('id')
          .single()

        if (createError) throw createError
        projectId = newProject.id
        successMessage = '프로젝트가 추가되었습니다.'  // 생성 시 메시지
      } else if (mode === 'edit' && project?.id) {
        // 기존 프로젝트 수정
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)

        if (updateError) throw updateError
        projectId = project.id
        successMessage = '프로젝트가 수정되었습니다.'  // 수정 시 메시지
      }

      // 실무자 정보 업데이트
      if (projectId) {
        // 기존 실무자 정보 삭제
        const { error: deleteError } = await supabase
          .from('project_manpower')
          .delete()
          .eq('project_id', projectId)

        if (deleteError) throw deleteError

        // 새로운 실무자 정보 추가
        if (Object.values(selectedWorkers).some(workers => workers.length > 0)) {
          const manpowerData = Object.entries(selectedWorkers).flatMap(([role, workers]) =>
            workers.map(worker => ({
              project_id: projectId,
              worker_id: worker.id,
              role: role as ProjectRole,
              mm_value: 0
            }))
          )

          if (manpowerData.length > 0) {
            const { error: insertError } = await supabase
              .from('project_manpower')
              .insert(manpowerData)

            if (insertError) throw insertError
          }
        }
      }

      toast.success(successMessage)  // 하나의 메시지만 표시
      onClose()
      onSubmit({ ...projectData, id: projectId })
    } catch (error: any) {
      console.error('Error saving project:', error.message || error)
      toast.error(error.message || '프로젝트 저장 중 오류가 발생했습니다.')
    }
  }

  const handleAddIntermediatePayment = () => {
    setIntermediatePayments([...intermediatePayments, ''])
  }

  const handleRemoveIntermediatePayment = (index: number) => {
    setIntermediatePayments(intermediatePayments.filter((_, i) => i !== index))
  }

  // 월 차이 계산 함수
  const getMonthDiff = (startDate: Date, endDate: Date) => {
    return (
      endDate.getMonth() -
      startDate.getMonth() +
      12 * (endDate.getFullYear() - startDate.getFullYear())
    )
  }

  // 공수 관리 버튼 클릭 핸들러
  const handleManpowerClick = () => {
    setShowManpowerButtons(!showManpowerButtons)
    if (!showManpowerButtons) {
      setShowManpowerModal(false)  // 버튼들이 닫힐 때 모달도 닫기
    }
  }

  // 공수 추가 버튼 클릭 핸들러
  const handleAddManpowerClick = () => {
    setShowManpowerModal(true)
  }

  // 드롭다운 클릭 핸들러 수정
  const handleMajorCategoryClick = (cat: ProjectMajorCategory) => {
    setMajorCategory(cat)
    setIsMajorCategoryOpen(false)
  }

  const handleCategoryClick = (cat: ProjectCategory) => {
    setCategory(cat)
    setIsCategoryOpen(false)
  }

  // 버튼 텍스트를 위한 함수 수정
  const getButtonText = () => {
    if (mode === 'edit') return '프로젝트 수정'
    return '프로젝트 추가'
  }

  // 삭제 버튼 클릭 핸들러 수정
  const handleDeleteClick = async () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      if (project?.id) {
        try {
          // 프로젝트 삭제
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id)

          if (deleteError) throw deleteError

          // toast 메시지 제거 (page.tsx에서 표시)
          onClose()
          onSubmit({ ...project, _action: 'delete' })
        } catch (error: any) {
          console.error('Error deleting project:', error)
          toast.error('프로젝트 삭제 중 오류가 발생했습니다.')
        }
      }
    }
  }

  // 검색 결과에서 첫 번째 실무자 선택하는 함수 추가
  const handleSearchEnter = (jobType: string) => {
    const filteredWorkers = getFilteredWorkers(jobType)
      .filter(worker => !selectedWorkers[jobType].some(w => w.id === worker.id))
    
    if (filteredWorkers.length > 0) {
      const firstWorker = filteredWorkers[0]
      handleWorkerSelect(jobType, { id: firstWorker.id, name: firstWorker.name })
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      {/* 스타일 태그 추가 */}
      <style>
        {datePickerWrapperStyles}
        {commonInputStyles}
      </style>
      
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={(event) => {
          // 모달이 열려있을 때는 Dialog의 onClose를 실행하지 않음
          if (!showManpowerModal) {
            onClose()
          }
        }}
      >
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
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 lg:pl-10">
                  <Transition.Child
                    as={Fragment}
                    enter="transform transition ease-in-out duration-500"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-500"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <Dialog.Panel className="pointer-events-auto w-screen max-w-[100vw] lg:max-w-6xl">
                      <div className="flex h-full flex-col overflow-y-scroll bg-white">
                        {/* 헤더 */}
                        <div className="fixed top-0 right-0 w-screen max-w-6xl bg-gray-50 border-b border-gray-200 z-10">
                          <div className="hidden sm:block flex-none px-2 py-2 sm:px-6">
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
                                {mode === 'edit' && (  // 수정 모드일 때만 삭제 버튼 표시
                                  <button
                                    type="button"
                                    onClick={handleDeleteClick}
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
                        </div>

                    {/* 본문에 상단 헤더 높이만큼 패딩 추가 */}
                    <div className="flex flex-1 pt-[49px]">
                      {/* 왼쪽: 입력 폼 */}
                      <div className="w-2/3 border-r border-gray-200 relative">
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

                          <div className="px-4 pb-[50px] pt-6 sm:px-6 space-y-6">
                            {/* 프로젝트명 입력 */}
                            <div>
                              <input
                                type="text"
                                value={title}
                                onChange={handleTitleChange}
                                maxLength={100}
                                className="block w-full text-[38px] font-bold px-0 border-0 focus:ring-0 focus:border-gray-900"
                                placeholder="프로젝트명을 입력하세요"
                              />
                              {isDuplicateName && (
                                <p className="mt-2 text-sm text-red-500">
                                  이미 존재하는 프로젝트명입니다. 구분할 수 있는 정보를 추가하면 좋아요.
                                </p>
                              )}
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
                                          onClick={() => handleMajorCategoryClick(cat)}
                                          className={`${
                                            majorCategory === cat ? 'bg-gray-100' : ''
                                          } w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50`}
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
                                          onClick={() => handleCategoryClick(cat)}
                                          className={`${
                                            category === cat ? 'bg-gray-100' : ''
                                          } w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50`}
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
                                      onChange={(date: Date | null) => setStartDate(date)}
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
                                      onChange={(date: Date | null) => setEndDate(date)}
                                      locale={ko}
                                      dateFormat="yyyy년 MM월 dd일"
                                      placeholderText="종료일"
                                      minDate={getMinDate(startDate)}
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
                                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                      </svg>
                                      직무 정보
                                    </div>

                                {/* 직무별 전체 공수 */}
                                <div className="space-y-6">
                                  <div className="text-black mb-4 text-[16px]">직무별 전체 공수</div>
                                  <div className="grid grid-cols-4 gap-4 pb-5">
                                    {/* 기획 */}
                                    <div className="w-full flex items-center">
                                      <div className="text-[13px] text-gray-500 mr-[8px]">기획</div>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={manpowerPlanning ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          setManpowerPlanning(value === '' ? null : Number(value))
                                        }}
                                        className="w-[84px] h-[31px] rounded-[6px] border border-[#B8B8B8] text-center bg-transparent outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                                        placeholder=""
                                      />
                                    </div>

                                    {/* 디자인 */}
                                    <div className="w-full flex items-center">
                                      <div className="text-[13px] text-gray-500 mr-[8px]">디자인</div>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={manpowerDesign ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          setManpowerDesign(value === '' ? null : Number(value))
                                        }}
                                        className="w-[84px] h-[31px] rounded-[6px] border border-[#B8B8B8] text-center bg-transparent outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                                        placeholder=""
                                      />
                                    </div>

                                    {/* 퍼블리싱 */}
                                    <div className="w-full flex items-center">
                                      <div className="text-[13px] text-gray-500 mr-[8px]">퍼블리싱</div>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={manpowerPublishing ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          setManpowerPublishing(value === '' ? null : Number(value))
                                        }}
                                        className="w-[84px] h-[31px] rounded-[6px] border border-[#B8B8B8] text-center bg-transparent outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                                        placeholder=""
                                      />
                                    </div>

                                    {/* 개발 */}
                                    <div className="w-full flex items-center">
                                      <div className="text-[13px] text-gray-500 mr-[8px]">개발</div>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={manpowerDevelopment ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          setManpowerDevelopment(value === '' ? null : Number(value))
                                        }}
                                        className="w-[84px] h-[31px] rounded-[6px] border border-[#B8B8B8] text-center bg-transparent outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                                        placeholder=""
                                      />
                                    </div>
                                  </div>
                                </div>

                              {/* 직무별 실무자 */}
                              <div className="space-y-6 mt-[25px] pb-[15px]">
                                <div className="text-black text-[16px] font-normal leading-[19.09px]">직무별 실무자</div>
                                <div className="space-y-[11px]">
                                  {Object.keys(searchTerms).map((jobType) => (
                                    <div key={jobType} className="flex items-center">
                                      <div className="text-[13px] text-gray-500 w-[56px]">{jobType}</div>
                                      <div className="relative w-[139px] mr-[8px]">
                                        <input
                                          type="text"
                                          value={searchTerms[jobType]}
                                          onChange={(e) => {
                                            setSearchTerms(prev => ({
                                              ...prev,
                                              [jobType]: e.target.value
                                            }))
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault()
                                              handleSearchEnter(jobType)
                                            }
                                          }}
                                          placeholder="이름을 입력하세요"
                                          className="w-full h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] text-sm focus:ring-0 focus:border-[#B8B8B8] placeholder:text-[12px]"
                                        />
                                        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black-400" />
                                        
                                        {/* 검색 결과 드롭다운 */}
                                        {searchTerms[jobType] && (
                                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            {getFilteredWorkers(jobType)
                                              .filter(worker => !selectedWorkers[jobType].some(w => w.id === worker.id))
                                              .map(worker => (
                                                <div
                                                  key={worker.id}
                                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[12px]"
                                                  onClick={() => handleWorkerSelect(jobType, { id: worker.id, name: worker.name })}
                                                >
                                                  {worker.name}
                                                </div>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] bg-white flex items-center flex-wrap gap-2">
                                        {selectedWorkers[jobType].map((worker) => (
                                          <span 
                                            key={worker.id} 
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[12px] bg-gray-100 border border-gray-300"
                                          >
                                            {worker.name}
                                            <button
                                              onClick={() => handleWorkerRemove(jobType, worker.id)}
                                              className="ml-1 text-gray-400 hover:text-gray-600"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
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
                                      {contractType === '회차 정산형' ? '회차 정산형' : '정기 결제형'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isContractTypeOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  
                                  {isContractTypeOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setContractType('회차 정산형')
                                          setIsContractTypeOpen(false)
                                        }}
                                        className={`${
                                          contractType === '회차 정산형' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                      >
                                        회차 정산형
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setContractType('정기 결제형')
                                          setIsContractTypeOpen(false)
                                        }}
                                        className={`${
                                          contractType === '정기 결제형' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } hover:bg-gray-50 group flex items-center px-4 py-2 w-full text-sm`}
                                      >
                                        정기 결제형
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 계약 유형별 추가 필드 */}
                                {contractType === '회차 정산형' ? (
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
                                          className="px-1 py-1 text-[11px] font-medium text-[#4E49E7] rounded-md flex items-center gap-1"
                                        >
                                          <span className="text-lg leading-none">+</span>
                                          차수 추가
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
                                          className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-400"
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

                                {/* 프로젝트 진행 기간 */}
                                <div className="pt-8 border-t border-gray-200">
                                  <div className="space-y-6 mt-2">
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
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" 
                                        />
                                      </svg>
                                      프로젝트 진행 기간
                                    </div>

                                    {/* 그래프 영역 */}
                                    <div className="relative">
                                      {/* 왼쪽 직무 라벨 */}
                                      <div className="absolute left-0 top-0 space-y-[22px] text-[13px] text-gray-500">
                                        <div>개발</div>
                                        <div>퍼블리싱</div>
                                        <div>디자인</div>
                                        <div>기획</div>
                                      </div>

                                      {/* 그래프 영역 */}
                                      <div className="ml-[56px]">
                                        {/* 그래프 라인들 */}
                                        <div className="relative h-[130px]">
                                          {/* 수평 구분선 */}
                                          <div className="absolute w-full border-t border-[#E5E5E5] top-0"></div>
                                          <div className="absolute w-full border-t border-[#E5E5E5] top-[25%]"></div>
                                          <div className="absolute w-full border-t border-[#E5E5E5] top-[50%]"></div>
                                          <div className="absolute w-full border-t border-[#E5E5E5] top-[75%]"></div>
                                          <div className="absolute w-full border-t border-[#E5E5E5] top-[100%]"></div>

                                          {/* 수직 구분선 */}
                                          {startDate && endDate && (
                                            <div className="absolute inset-0 flex justify-between w-full h-full">
                                              {Array.from({ length: getMonthDiff(startDate, endDate) + 1 }).map((_, index) => (
                                                <div 
                                                  key={index} 
                                                  className="border-l border-[#E5E5E5] h-full"
                                                ></div>
                                              ))}
                                            </div>
                                          )}

                                          {/* 여기에 실제 데이터 라인이 들어갈 공간 */}
                                          <div className="relative h-full">
                                            {/* 데이터 라인은 나중에 실제 데이터에 따라 동적으로 생성 */}
                                          </div>
                                        </div>

                                        {/* 월 표시 */}
                                        <div className="flex justify-between mt-2 text-[13px] text-gray-500">
                                          {startDate && endDate && (
                                            <div className="flex justify-between w-full">
                                              {Array.from({ length: getMonthDiff(startDate, endDate) + 1 }).map((_, index) => {
                                                const currentDate = new Date(startDate)
                                                currentDate.setMonth(startDate.getMonth() + index)
                                                return (
                                                  <div key={index}>
                                                    {currentDate.toLocaleDateString('ko-KR', { month: 'long' })}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                </div>
                                </div>

                              </div>
                            </div>
                          </div>

                          {/* 하단 버튼 */}
                          <div className="bottom-0 left-0 w-[100%] bg-white border-t border-gray-200">
                            <div className="px-4 py-4">
                              <div className="flex flex-row gap-2">
                                <button
                                  type="submit"
                                  form="projectForm"
                                  className="flex-1 py-3 px-4 text-[14px] font-medium text-white bg-[#4E49E7] hover:bg-[#3F3ABE] rounded-lg"
                                >
                                  {getButtonText()}
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* 오른쪽: 프로젝트 정보 */}
                      <div className="w-1/3 bg-white">
                        <div className="px-4 py-6 sm:px-6">
                          {/* 버튼 컨테이너 */}
                          <div>
                            <div className="flex flex-row gap-2">
                              {/* 실무자 공수 관리 버튼 */}
                              <button
                                type="button"
                                className="w-[49%] h-[44px] bg-[#FFFF01] rounded-[6px] font-pretendard font-semibold text-[16px] leading-[19.09px] text-black"
                                onClick={handleManpowerClick}
                              >
                                실무자 공수 관리
                              </button>

                              {/* 마일스톤 등록 및 확인 버튼 */}
                              <button
                                type="button"
                                className="w-[49%] h-[44px] bg-[#4E49E7] rounded-[6px] font-pretendard font-semibold text-[16px] leading-[19.09px] text-white"
                              >
                                마일스톤 등록 및 확인
                              </button>
                            </div>

                            {/* 공수 관리 하위 버튼들 */}
                            {showManpowerButtons && (
                              <div className="flex gap-2 mt-2 justify-end">
                                <button
                                  type="button"
                                  className="h-[32px] px-4 bg-white border border-[#4E49E7] rounded-[6px] font-pretendard font-medium text-[14px] leading-[16.71px] text-[#4E49E7]"
                                  onClick={handleAddManpowerClick}
                                >
                                  공수 추가
                                </button>
                                <button
                                  type="button"
                                  className="h-[32px] px-4 bg-white border border-[#4E49E7] rounded-[6px] font-pretendard font-medium text-[14px] leading-[16.71px] text-[#4E49E7]"
                                >
                                  공수 수정
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 해당월 공수진행 섹션 */}
                          <div className="mt-8">
                            {/* 타이틀 */}
                            <h4 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mb-4">
                              2월 진행 공수
                            </h4>

                            {/* 직무별 공수 목록 */}
                            <div className="space-y-4 flex flex-row items-baseline gap-2 flex-wrap">
                              {/* 기획 */}
                              <div className="w-[48.5%]">
                                <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                  기획
                                </span>
                                <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                  <li className="flex justify-between relative pl-3">
                                    <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                    <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                      홍길동A
                                    </span>
                                    <div className="flex items-baseline">
                                      <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                      <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                    </div>
                                  </li>
                                  <li className="flex justify-between relative pl-3">
                                    <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                    <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                      홍길동B
                                    </span>
                                    <div className="flex items-baseline">
                                      <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.5</span>
                                      <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>

                              {/* 디자이너 */}
                              <div className="w-[48.5%]">
                                <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                  디자이너
                                </span>
                                <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                  <li className="flex justify-between relative pl-3">
                                    <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                    <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                      홍길동C
                                    </span>
                                    <div className="flex items-baseline">
                                      <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                      <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>

                              {/* 퍼블리셔 */}
                              <div className="w-[48.5%]">
                                <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                  퍼블리셔
                                </span>
                                <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                  <li className="flex justify-between relative pl-3">
                                    <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                    <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                      홍길동D
                                    </span>
                                    <div className="flex items-baseline">
                                      <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                      <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>

                              {/* 개발 */}
                              <div className="w-[48.5%]">
                                <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                  개발
                                </span>
                                <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                  <li className="flex justify-between relative pl-3">
                                    <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                    <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                      홍길동E
                                    </span>
                                    <div className="flex items-baseline">
                                      <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                      <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                    </div>
                                  </li>
                                  <li className="flex justify-between relative pl-3">
                                    <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                    <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                      홍길동F
                                    </span>
                                    <div className="flex items-baseline">
                                      <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.8</span>
                                      <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>
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

      {/* 모달 추가 */}
      {showManpowerModal && (
        <AddManpowerModal
          isOpen={showManpowerModal}
          onClose={() => setShowManpowerModal(false)}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </Transition.Root>
  )
} 