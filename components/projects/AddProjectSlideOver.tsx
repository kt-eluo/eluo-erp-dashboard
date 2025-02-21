'use client'

import { useState, Fragment, useRef, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ArrowLeft, ChevronDown, Calendar, Search } from 'lucide-react'
import type { Project, ProjectStatus, ProjectCategory, ProjectMajorCategory, ContractType, PeriodicUnit, ProjectRole, ManpowerSummary } from '@/types/project'
import { toast } from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'
import AddManpowerModal from './AddManpowerModal'
import { supabase } from '@/lib/supabase'
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

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface AddProjectSlideOverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: any) => void
  project?: Project | null
  mode?: 'create' | 'edit'
  openManpowerModal?: boolean
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
  total_mm_value?: number // 총 공수 값 추가
}

interface SelectedWorkers {
  [key: string]: Worker[];
}

// 타입 정의 추가
interface ProjectManpower {
  id: string
  worker_id: string
  role: string
  mm_value: number
  workers?: {
    id: string
    name: string
  }
}

interface UpdatedProject {
  id: string
  name: string
  client: string
  description: string
  status: ProjectStatus
  major_category: ProjectMajorCategory
  category: ProjectCategory
  start_date: string | null
  end_date: string | null
  project_manpower: ProjectManpower[]
  planning_manpower: number | null
  design_manpower: number | null
  publishing_manpower: number | null
  development_manpower: number | null
}

// 타입 정의 추가
interface RoleEffortData {
  role: string;
  monthlyEfforts: number[];
}

// 직무별 색상 정의는 컴포넌트 밖에 유지
const roleColors = {
  '기획': '#4E49E7',
  '디자인': '#FF6B6B',
  '퍼블리싱': '#51CF66',
  '개발': '#339AF0'
};

// 월별 공수 데이터 타입 정의 추가
interface MonthlyEffort {
  [role: string]: {
    [month: string]: number;
  };
}

export default function AddProjectSlideOver({
  isOpen,
  onClose,
  onSubmit,
  project,
  mode = 'create',
  openManpowerModal = false
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

  const [selectedWorkers, setSelectedWorkers] = useState<SelectedWorkers>({
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

  // state 추가
  const [roleEfforts, setRoleEfforts] = useState<RoleEffortData[]>([]);

  // 상태 추가 (컴포넌트 최상단 상태 선언부에 추가)
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({
    'BD(BM)': false,
    'PM(PL)': false,
    '기획': false,
    '디자이너': false,
    '퍼블리셔': false,
    '개발': false
  });

  // 외부 클릭 감지를 위한 ref 추가
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({
    'BD(BM)': null,
    'PM(PL)': null,
    '기획': null,
    '디자이너': null,
    '퍼블리셔': null,
    '개발': null
  });

  // 외부 클릭 감지 useEffect 수정
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 모달이 열려있을 때는 외부 클릭 감지를 하지 않음
      if (showManpowerModal) return;

      // 각 드롭다운 ref에 대한 클릭 감지 확인
      Object.entries(dropdownRefs.current).forEach(([jobType, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns(prev => ({
            ...prev,
            [jobType]: false
          }));
        }
      });

      // 기존의 다른 ref 체크들...
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManpowerModal]);

  // 프로젝트 데이터로 폼 초기화
  useEffect(() => {
    if (project && mode === 'edit') {
      // 기본 정보
      setTitle(project.name);
      setClient(project.client || '');
      setDescription(project.description || '');
      
      // 날짜 정보
      setStartDate(project.start_date ? new Date(project.start_date) : null);
      setEndDate(project.end_date ? new Date(project.end_date) : null);
      
      // 카테고리 및 상태 정보
      setStatus(project.status || '');
      setMajorCategory(project.major_category || '');
      setCategory(project.category || '');
      
      // 직무별 전체 공수 정보 설정
      setManpowerPlanning(project.planning_manpower || null);
      setManpowerDesign(project.design_manpower || null);
      setManpowerPublishing(project.publishing_manpower || null);
      setManpowerDevelopment(project.development_manpower || null);

      // 계약 정보 설정 - null 체크 추가
      if (project.contract_type) {
        setContractType(project.contract_type);
        setContractAmount(project.budget?.toString() || '');
        setIsVatIncluded(project.is_vat_included || false);
        setCommonExpense(project.common_expense?.toString() || '');

        if (project.contract_type === '회차 정산형') {
          setDownPayment(project.down_payment?.toString() || '');
          setIntermediatePayments(project.intermediate_payments?.map(p => p?.toString() || '') || ['']);
          setFinalPayment(project.final_payment?.toString() || '');
        } else if (project.contract_type === '정기 결제형') {
          setPeriodicUnit(project.periodic_unit || 'month');
          setPeriodicInterval(project.periodic_interval?.toString() || '');
          setPeriodicAmount(project.periodic_amount?.toString() || '');
        }
      }
    }
  }, [project, mode]);

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
    const searchTerm = searchTerms[jobType].toLowerCase();
    
    // 검색어가 있을 때는 일반 검색 결과 반환
    if (searchTerm) {
      return workers.filter(worker => 
        worker.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // 검색 아이콘으로 열었을 때는 필터링된 목록 반환
    return filteredWorkersList[jobType];
  };

  // 실무자 선택 핸들러 수정
  const handleWorkerSelect = async (jobType: string, worker: { id: string; name: string }) => {
    try {
      if (mode === 'edit' && project?.id) {
        // 1. project_manpower 테이블에 데이터 추가
        const { data, error } = await supabase
          .from('project_manpower')
          .upsert({
            project_id: project.id,
            worker_id: worker.id,
            role: jobType
          }, {
            onConflict: 'project_id,worker_id,role'  // 중복 체크할 컬럼 지정
          })
          .select(`
            id,
            workers (
              id,
              name,
              job_type
            )
          `)
          .single();

        if (error) {
          console.error('Error details:', error);
          throw error;
        }

        // 2. UI 업데이트
        setSelectedWorkers(prev => ({
          ...prev,
          [jobType]: [
            ...prev[jobType],
            {
              id: worker.id,
              name: worker.name,
              job_type: data.workers?.job_type || '',
              total_mm_value: 0
            }
          ]
        }));

        // 검색어 초기화
        setSearchTerms(prev => ({
          ...prev,
          [jobType]: ''
        }));

        toast.success('실무자가 추가되었습니다.');

        // 선택 후 드롭다운 닫기
        handleCloseDropdown(jobType);
      }
    } catch (error) {
      console.error('Error in handleWorkerSelect:', error);
      toast.error('실무자 추가 중 오류가 발생했습니다.');
    }
  };

  // 실무자 제거 핸들러 수정
  const handleRemoveWorker = async (jobType: string, workerId: string) => {
    try {
      if (mode === 'edit' && project?.id) {
        // 1. project_manpower 테이블에서 데이터 삭제
        const { error } = await supabase
          .from('project_manpower')
          .delete()
          .match({
            project_id: project.id,
            worker_id: workerId,
            role: jobType
          });

        if (error) {
          console.error('Error removing worker:', error);
          throw error;
        }

        // 2. UI 업데이트
        setSelectedWorkers(prev => ({
          ...prev,
          [jobType]: prev[jobType].filter(worker => worker.id !== workerId)
        }));

        toast.success('실무자가 제거되었습니다.');
      }
    } catch (error) {
      console.error('Error in handleRemoveWorker:', error);
      toast.error('실무자 제거 중 오류가 발생했습니다.');
    }
  };

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

  // handleSubmit 함수 수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'edit' && project?.id) {
        const updatedProject: any = {
          name: title,
          updated_at: new Date().toISOString(),
          planning_manpower: manpowerPlanning,
          design_manpower: manpowerDesign,
          publishing_manpower: manpowerPublishing,
          development_manpower: manpowerDevelopment,
          // 계약 정보 추가
          contract_type: contractType,
          budget: contractAmount ? parseInt(contractAmount.replace(/[^\d]/g, '')) : null,
          is_vat_included: isVatIncluded,
          common_expense: commonExpense ? parseInt(commonExpense.replace(/[^\d]/g, '')) : null,
        };

        // 기본 필드 추가
        if (status) updatedProject.status = status;
        if (majorCategory) updatedProject.major_category = majorCategory;
        if (category) updatedProject.category = category;
        if (startDate) updatedProject.start_date = startDate.toISOString();
        if (endDate) updatedProject.end_date = endDate.toISOString();

        // 계약 유형에 따른 필드 추가
        if (contractType === '회차 정산형') {
          updatedProject.down_payment = downPayment ? parseInt(downPayment.replace(/[^\d]/g, '')) : null;
          updatedProject.intermediate_payments = intermediatePayments.map(p => p ? parseInt(p.replace(/[^\d]/g, '')) : null);
          updatedProject.final_payment = finalPayment ? parseInt(finalPayment.replace(/[^\d]/g, '')) : null;
          // 정기 결제형 필드 초기화
          updatedProject.periodic_unit = null;
          updatedProject.periodic_interval = null;
          updatedProject.periodic_amount = null;
        } else if (contractType === '정기 결제형') {
          updatedProject.periodic_unit = periodicUnit;
          updatedProject.periodic_interval = periodicInterval ? parseInt(periodicInterval) : null;
          updatedProject.periodic_amount = periodicAmount ? parseInt(periodicAmount.replace(/[^\d]/g, '')) : null;
          // 회차 정산형 필드 초기화
          updatedProject.down_payment = null;
          updatedProject.intermediate_payments = null;
          updatedProject.final_payment = null;
        }

        // 프로젝트 데이터 업데이트
        const { error } = await supabase
          .from('projects')
          .update(updatedProject)
          .eq('id', project.id);

        if (error) {
          console.error('Error details:', error);
          throw new Error(`프로젝트 수정 중 오류가 발생했습니다: ${error.message}`);
        }

        toast.success('프로젝트가 수정되었습니다.');
      } else {
        // 새 프로젝트 생성 시
        const newProject: any = {
          name: title
        };

        // 값이 있는 경우에만 포함
        if (status) newProject.status = status;
        if (majorCategory) newProject.major_category = majorCategory;
        if (category) newProject.category = category;
        if (startDate) newProject.start_date = startDate.toISOString();
        if (endDate) newProject.end_date = endDate.toISOString();
        
        // 공수 값이 null이 아닌 경우에만 포함
        if (manpowerPlanning !== null) newProject.planning_manpower = manpowerPlanning;
        if (manpowerDesign !== null) newProject.design_manpower = manpowerDesign;
        if (manpowerPublishing !== null) newProject.publishing_manpower = manpowerPublishing;
        if (manpowerDevelopment !== null) newProject.development_manpower = manpowerDevelopment;

        // 1. 새 프로젝트 생성
        const { data, error } = await supabase
          .from('projects')
          .insert([newProject])
          .select();

        if (error) {
          console.error('Error details:', error);
          throw new Error(`새 프로젝트 생성 중 오류가 발생했습니다: ${error.message}`);
        }

        // 2. 직무별 실무자 데이터 추가
        if (data?.[0]?.id) {
          const manpowerData = Object.entries(selectedWorkers).flatMap(([role, workers]) =>
            workers.map(worker => ({
              project_id: data[0].id,
              worker_id: worker.id,
              role: role
            }))
          );

          if (manpowerData.length > 0) {
            const { error: insertError } = await supabase
              .from('project_manpower')
              .insert(manpowerData);

            if (insertError) throw insertError;
          }
        }

        toast.success('새 프로젝트가 생성되었습니다.');
        onSubmit(data[0]);
        onClose();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error instanceof Error ? error.message : '프로젝트 저장 중 오류가 발생했습니다.');
    }
  };

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

  // activeTab state 추가
  const [activeTab, setActiveTab] = useState<'manpower' | 'milestone'>('manpower')

  // 월 인덱스 계산 함수 추가
  const getMonthIndex = (year: number, month: number): number => {
    if (!startDate) return -1;
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    return ((year - startYear) * 12 + month - startMonth);
  };

  // 직무별 공수 데이터를 가져오는 함수 수정
  const fetchRoleEfforts = async () => {
    if (!project?.id || !startDate || !endDate) return;

    try {
      const { data, error } = await supabase
        .from('project_manpower')
        .select(`
          role,
          project_monthly_efforts (
            year,
            month,
            mm_value
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;

      // 직무 매핑 정의
      const roleMapping: { [key: string]: string } = {
        '기획': '기획',
        '디자이너': '디자인',
        '퍼블리셔': '퍼블리싱',
        '개발': '개발'
      };

      // 월별, 직무별 공수 데이터 초기화
      const monthCount = getMonthDiff(startDate, endDate) + 1;
      const monthlyRoleEfforts: { [key: string]: number[] } = {
        '기획': Array(monthCount).fill(0),
        '디자인': Array(monthCount).fill(0),
        '퍼블리싱': Array(monthCount).fill(0),
        '개발': Array(monthCount).fill(0)
      };

      // 데이터 처리
      data?.forEach(mp => {
        const mappedRole = roleMapping[mp.role];
        if (!mappedRole) return;

        mp.project_monthly_efforts?.forEach((effort: { year: number; month: number; mm_value: number }) => {
          const monthIndex = getMonthIndex(effort.year, effort.month);
          if (monthIndex >= 0 && monthIndex < monthCount) {
            monthlyRoleEfforts[mappedRole][monthIndex] += (effort.mm_value || 0);
          }
        });
      });

      // 결과 데이터 구성
      const roleEffortData: RoleEffortData[] = Object.entries(monthlyRoleEfforts).map(([role, monthlyEfforts]) => ({
        role,
        monthlyEfforts
      }));

      setRoleEfforts(roleEffortData);
    } catch (error) {
      console.error('Error fetching role efforts:', error);
    }
  };

  // useEffect 수정 - 의존성 추가
  useEffect(() => {
    if (project?.id) {
      fetchRoleEfforts();
    }
  }, [project?.id, showManpowerModal]); // showManpowerModal 의존성 추가

  // handleManpowerUpdate 함수 수정
  const handleManpowerUpdate = async (updatedWorkers: SelectedWorkers) => {
    setSelectedWorkers(updatedWorkers);
    // 데이터 업데이트 후 즉시 새로운 데이터 fetch
    await fetchWorkerEfforts();
    await fetchRoleEfforts();
  };

  // fetchWorkerEfforts 함수 수정
  const fetchWorkerEfforts = async () => {
    if (!project?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('project_manpower')
        .select(`
          id,
          role,
          grade,
          position,
          unit_price,
          workers (
            id,
            name,
            job_type
          ),
          project_monthly_efforts (
            year,
            month,
            mm_value
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;

      const workersByRole: SelectedWorkers = {
        'BD(BM)': [],
        'PM(PL)': [],
        '기획': [],
        '디자이너': [],
        '퍼블리셔': [],
        '개발': []
      };

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      data.forEach(mp => {
        if (mp.workers) {
          // 현재 월의 공수만 찾기
          const currentMonthEffort = mp.project_monthly_efforts?.find(
            effort => effort.year === currentYear && effort.month === currentMonth
          );

          workersByRole[mp.role].push({
            id: mp.workers.id,
            name: mp.workers.name,
            job_type: mp.workers.job_type || '',
            grade: mp.grade,
            position: mp.position,
            unit_price: mp.unit_price,
            total_mm_value: Number(currentMonthEffort?.mm_value) || 0
          });
        }
      });

      setSelectedWorkers(workersByRole);
    } catch (error) {
      console.error('Error fetching worker efforts:', error);
    }
  };

  // useEffect 추가
  useEffect(() => {
    if (project?.id) {
      fetchWorkerEfforts();
    }
  }, [project?.id]); // project.id가 변경될 때마다 실행

  // 프로젝트 데이터 로딩 부분 수정
  useEffect(() => {
    if (project?.id) {
      const fetchProjectData = async () => {
        try {
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;

          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select(`
              *,
              project_manpower (
                id,
                role,
                workers (
                  id,
                  name,
                  job_type
                ),
                project_monthly_efforts!inner (
                  year,
                  month,
                  mm_value
                )
              )
            `)
            .eq('id', project.id)
            .eq('project_manpower.project_monthly_efforts.year', currentYear)
            .eq('project_manpower.project_monthly_efforts.month', currentMonth)
            .single();

          if (projectError) throw projectError;

          // 프로젝트 기본 정보 설정
          if (projectData) {
            setTitle(projectData.name || '');
            setStatus(projectData.status || '');
            setMajorCategory(projectData.major_category || '');
            setCategory(projectData.category || '');
            setStartDate(projectData.start_date ? new Date(projectData.start_date) : null);
            setEndDate(projectData.end_date ? new Date(projectData.end_date) : null);
            setManpowerPlanning(projectData.planning_manpower);
            setManpowerDesign(projectData.design_manpower);
            setManpowerPublishing(projectData.publishing_manpower);
            setManpowerDevelopment(projectData.development_manpower);
          }

          // 실무자 데이터 설정
          const workersByRole: SelectedWorkers = {
            'BD(BM)': [],
            'PM(PL)': [],
            '기획': [],
            '디자이너': [],
            '퍼블리셔': [],
            '개발': []
          };

          projectData.project_manpower?.forEach((mp: any) => {
            if (mp.workers) {
              // 현재 월의 공수만 사용
              const currentMonthEffort = mp.project_monthly_efforts?.[0]?.mm_value || 0;

              workersByRole[mp.role].push({
                id: mp.workers.id,
                name: mp.workers.name,
                job_type: mp.workers.job_type || '',
                total_mm_value: currentMonthEffort
              });
            }
          });

          setSelectedWorkers(workersByRole);
        } catch (error) {
          console.error('Error fetching project data:', error);
          toast.error('프로젝트 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      };

      fetchProjectData();
    }
  }, [project?.id]);

  // useEffect 추가
  useEffect(() => {
    if (isOpen && openManpowerModal) {
      setShowManpowerModal(true)
    }
  }, [isOpen, openManpowerModal])

  // 직무별 전체 공수 입력 핸들러들 수정
  const handleManpowerPlanningChange = (value: string) => {
    const numValue = value === '' ? null : Number(value);
    setManpowerPlanning(numValue);
  };

  const handleManpowerDesignChange = (value: string) => {
    const numValue = value === '' ? null : Number(value);
    setManpowerDesign(numValue);
  };

  const handleManpowerPublishingChange = (value: string) => {
    const numValue = value === '' ? null : Number(value);
    setManpowerPublishing(numValue);
  };

  const handleManpowerDevelopmentChange = (value: string) => {
    const numValue = value === '' ? null : Number(value);
    setManpowerDevelopment(numValue);
  };

  // 검색 아이콘 클릭 시 사용할 함수 수정
  const handleSearchIconClick = async (jobType: string) => {
    try {
      // 현재 드롭다운 상태 확인
      const isCurrentlyOpen = openDropdowns[jobType];

      if (!isCurrentlyOpen) {
        // 드롭다운이 닫혀있을 때만 데이터 fetch
        const { data: activeWorkers } = await supabase
          .from('project_manpower')
          .select('worker_id')
          .not('worker_id', 'is', null);

        const activeWorkerIds = new Set(activeWorkers?.map(w => w.worker_id) || []);
        const availableWorkers = workers.filter(worker => !activeWorkerIds.has(worker.id));
        
        setFilteredWorkersList(prev => ({
          ...prev,
          [jobType]: availableWorkers
        }));
      }

      // 드롭다운 상태 토글
      setOpenDropdowns(prev => ({
        ...prev,
        [jobType]: !isCurrentlyOpen
      }));

      // 검색어 초기화
      setSearchTerms(prev => ({
        ...prev,
        [jobType]: ''
      }));

    } catch (error) {
      console.error('Error fetching available workers:', error);
    }
  };

  // 드롭다운 닫기 핸들러 추가
  const handleCloseDropdown = (jobType: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [jobType]: false
    }));
  };

  // 필터링된 실무자 목록을 위한 상태 추가
  const [filteredWorkersList, setFilteredWorkersList] = useState<{[key: string]: Worker[]}>({
    'BD(BM)': [],
    'PM(PL)': [],
    '기획': [],
    '디자이너': [],
    '퍼블리셔': [],
    '개발': []
  });

  // 컴포넌트 상단에 현재 날짜 관련 상수 추가
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  // 월 목록 생성 함수 수정
  const getMonths = useCallback(() => {
    if (!startDate || !endDate) return [];
    
    const months: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 연도와 월만 비교하기 위해 날짜는 1일로 통일
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    // 종료월까지 포함하기 위해 lastMonth에 1개월을 더한 값과 비교
    while (current <= lastMonth) {
      months.push(`${current.getFullYear()}년 ${current.getMonth() + 1}월`);
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, [startDate, endDate]);

  // 상단에 상태 및 유틸리티 함수 추가
  const [monthlyEfforts, setMonthlyEfforts] = useState<{
    [role: string]: { [month: string]: number }
  }>({});

  const getMonthsBetween = (start: Date, end: Date) => {
    const months: string[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  // 공수 데이터 가져오는 함수 개선
  const fetchMonthlyEfforts = async () => {
    if (!project?.id || !startDate || !endDate) return;

    try {
      // 1. 프로젝트의 모든 공수 데이터를 한 번에 가져오기
      const { data: manpowerData, error: manpowerError } = await supabase
        .from('project_manpower')
        .select(`
          id,
          role,
          worker_id,
          project_monthly_efforts (
            year,
            month,
            mm_value
          )
        `)
        .eq('project_id', project.id);

      if (manpowerError) throw manpowerError;

      // 2. 초기 데이터 구조 설정
      const effortsByRole: MonthlyEffort = {
        '기획': {},
        '디자이너': {},
        '퍼블리셔': {},
        '개발': {}
      };

      // 3. 데이터 처리 및 유효성 검사
      manpowerData?.forEach(mp => {
        if (!mp.role || !mp.project_monthly_efforts) return;

        mp.project_monthly_efforts.forEach(effort => {
          if (!effort.year || !effort.month || effort.mm_value === null) return;

          const monthKey = `${effort.year}-${String(effort.month).padStart(2, '0')}`;
          
          // 해당 월이 프로젝트 기간 내에 있는지 확인
          const effortDate = new Date(effort.year, effort.month - 1);
          if (effortDate >= startDate && effortDate <= endDate) {
            effortsByRole[mp.role] = effortsByRole[mp.role] || {};
            effortsByRole[mp.role][monthKey] = (effortsByRole[mp.role][monthKey] || 0) + effort.mm_value;
          }
        });
      });

      // 4. 상태 업데이트 전 데이터 검증
      Object.keys(effortsByRole).forEach(role => {
        Object.keys(effortsByRole[role]).forEach(month => {
          if (isNaN(effortsByRole[role][month])) {
            effortsByRole[role][month] = 0;
          }
        });
      });

      setMonthlyEfforts(effortsByRole);
    } catch (error) {
      console.error('Error fetching monthly efforts:', error);
      toast.error('공수 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // useEffect에 추가
  useEffect(() => {
    if (project?.id && startDate && endDate) {
      fetchMonthlyEfforts();
    }
  }, [project?.id, startDate, endDate]);

  // 그래프 데이터 생성 함수 추가
  const getChartData = useCallback(() => {
    if (!startDate || !endDate || !monthlyEfforts) return null;

    const months = getMonthsBetween(startDate, endDate);
    
    return {
      labels: months,
      datasets: [
        {
          label: '기획',
          data: months.map(month => monthlyEfforts['기획']?.[month] || 0),
          borderColor: '#4E49E7',
          backgroundColor: 'rgba(78, 73, 231, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: '디자이너',
          data: months.map(month => monthlyEfforts['디자이너']?.[month] || 0),
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: '퍼블리셔',
          data: months.map(month => monthlyEfforts['퍼블리셔']?.[month] || 0),
          borderColor: '#51CF66',
          backgroundColor: 'rgba(81, 207, 102, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: '개발',
          data: months.map(month => monthlyEfforts['개발']?.[month] || 0),
          borderColor: '#339AF0',
          backgroundColor: 'rgba(51, 154, 240, 0.1)',
          tension: 0.4,
          fill: false
        }
      ]
    };
  }, [startDate, endDate, monthlyEfforts]);

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
                                        onChange={(e) => handleManpowerPlanningChange(e.target.value)}
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
                                        onChange={(e) => handleManpowerDesignChange(e.target.value)}
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
                                        onChange={(e) => handleManpowerPublishingChange(e.target.value)}
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
                                        onChange={(e) => handleManpowerDevelopmentChange(e.target.value)}
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
                                      <div 
                                        className="relative w-[139px] mr-[8px]"
                                        ref={el => dropdownRefs.current[jobType] = el}
                                      >
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
                                        <Search 
                                          className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black-400 cursor-pointer name-search-input" 
                                          onClick={() => handleSearchIconClick(jobType)}
                                        />
                                        
                                        {/* 검색 결과 드롭다운 */}
                                        {(searchTerms[jobType] || openDropdowns[jobType]) && (
                                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            {!searchTerms[jobType] && (  // 검색어가 없을 때만 유효인력 레이블 표시
                                              <div className="p-2 text-xs text-gray-500 border-b">
                                                [유효인력]
                                              </div>
                                            )}
                                            <div className="max-h-48 overflow-y-auto">
                                              {getFilteredWorkers(jobType)
                                                .filter(worker => !selectedWorkers[jobType].some(w => w.id === worker.id))
                                                .map(worker => (
                                                  <div
                                                    key={worker.id}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[12px]"
                                                    onClick={() => {
                                                      handleWorkerSelect(jobType, { id: worker.id, name: worker.name });
                                                      handleCloseDropdown(jobType);
                                                    }}
                                                  >
                                                    {worker.name}
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] bg-white flex items-center flex-wrap gap-2">
                                        {selectedWorkers[jobType].map((worker) => (
                                          <div
                                            key={worker.id}
                                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                                          >
                                            <span>{worker.name}</span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveWorker(jobType, worker.id)}
                                              className="ml-1 p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                                            >
                                              <X className="w-3 h-3 text-gray-500" />
                                            </button>
                                          </div>
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
                                    <div className="h-[200px] mb-6">
                                      <Line
                                        data={{
                                          labels: startDate && endDate ? getMonthsBetween(startDate, endDate) : [],
                                          datasets: [
                                            {
                                              label: '기획',
                                              data: startDate && endDate ? 
                                                getMonthsBetween(startDate, endDate)
                                                  .map(month => monthlyEfforts['기획']?.[month] || 0) : [],
                                              borderColor: '#4E49E7',
                                              backgroundColor: 'rgba(78, 73, 231, 0.1)',
                                              tension: 0.4,
                                              fill: false
                                            },
                                            {
                                              label: '디자이너',
                                              data: startDate && endDate ?
                                                getMonthsBetween(startDate, endDate)
                                                  .map(month => monthlyEfforts['디자이너']?.[month] || 0) : [],
                                              borderColor: '#FF6B6B',
                                              backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                              tension: 0.4,
                                              fill: false
                                            },
                                            {
                                              label: '퍼블리셔',
                                              data: startDate && endDate ?
                                                getMonthsBetween(startDate, endDate)
                                                  .map(month => monthlyEfforts['퍼블리셔']?.[month] || 0) : [],
                                              borderColor: '#51CF66',
                                              backgroundColor: 'rgba(81, 207, 102, 0.1)',
                                              tension: 0.4,
                                              fill: false
                                            },
                                            {
                                              label: '개발',
                                              data: startDate && endDate ?
                                                getMonthsBetween(startDate, endDate)
                                                  .map(month => monthlyEfforts['개발']?.[month] || 0) : [],
                                              borderColor: '#339AF0',
                                              backgroundColor: 'rgba(51, 154, 240, 0.1)',
                                              tension: 0.4,
                                              fill: false
                                            }
                                          ]
                                        }}
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                            legend: {
                                              display: true,
                                              position: 'top',
                                              align: 'end'
                                            }
                                          },
                                          scales: {
                                            y: {
                                              beginAtZero: true,
                                              max: 1.5,
                                              ticks: {
                                                callback: value => `${value} M/M`,
                                                stepSize: 0.2
                                              }
                                            }
                                          }
                                        }}
                                      />
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
                            {/* 버튼 영역 */}
                            <div>
                              <div className="flex flex-row gap-2">
                                {/* 실무자 공수 관리 버튼 */}
                                <button
                                  type="button"
                                  className="w-[49%] h-[44px] bg-[#FFFF01] rounded-[6px] font-pretendard font-semibold text-[16px] leading-[19.09px] text-black"
                                  onClick={handleAddManpowerClick}
                                >
                                  실무자 공수 관리
                                </button>

                                {/* 마일스톤 등록 및 확인 버튼 */}
                                <button
                                  type="button"
                                  className="w-[49%] h-[44px] bg-[#4E49E7] rounded-[6px] font-pretendard font-semibold text-[16px] leading-[19.09px] text-white"
                                  onClick={() => setActiveTab('milestone')}
                                >
                                  마일스톤 등록 및 확인
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 해당월 공수진행 섹션 */}
                          <div className="mt-8">
                            {/* 타이틀 */}
                            <h4 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mb-4">
                              {currentMonth}월 진행 공수
                            </h4>

                            {/* 직무별 공수 목록 */}
                            <div className="space-y-4 flex flex-row items-baseline gap-2 flex-wrap">
                              {/* 기획 */}
                              {selectedWorkers['기획']?.length > 0 && (
                                <div className="w-[100%]">
                                  <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                    기획
                                  </span>
                                  <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                    {selectedWorkers['기획'].map(worker => (
                                      <li key={worker.id} className="flex justify-between relative pl-3">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {worker.total_mm_value?.toFixed(1) || '0.0'}
                                          </span>
                                          <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 디자이너 */}
                              {selectedWorkers['디자이너']?.length > 0 && (
                                <div className="w-[100%]">
                                  <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                    디자이너
                                  </span>
                                  <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                    {selectedWorkers['디자이너'].map(worker => (
                                      <li key={worker.id} className="flex justify-between relative pl-3">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {worker.total_mm_value?.toFixed(1) || '0.0'}
                                          </span>
                                          <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 퍼블리셔 */}
                              {selectedWorkers['퍼블리셔']?.length > 0 && (
                                <div className="w-[100%]">
                                  <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                    퍼블리셔
                                  </span>
                                  <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                    {selectedWorkers['퍼블리셔'].map(worker => (
                                      <li key={worker.id} className="flex justify-between relative pl-3">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {worker.total_mm_value?.toFixed(1) || '0.0'}
                                          </span>
                                          <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 개발 */}
                              {selectedWorkers['개발']?.length > 0 && (
                                <div className="w-[100%]">
                                  <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                                    개발
                                  </span>
                                  <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                                    {selectedWorkers['개발'].map(worker => (
                                      <li key={worker.id} className="flex justify-between relative pl-3">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {worker.total_mm_value?.toFixed(1) || '0.0'}
                                          </span>
                                          <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
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

      {/* 공수 관리 모달 */}
      {showManpowerModal && (
        <AddManpowerModal
          isOpen={showManpowerModal}
          onClose={() => setShowManpowerModal(false)}
          projectId={project?.id || ''}
          startDate={startDate}
          endDate={endDate}
          selectedWorkers={selectedWorkers}
          onManpowerUpdate={handleManpowerUpdate}
        />
      )}
    </Transition.Root>
  )
} 
