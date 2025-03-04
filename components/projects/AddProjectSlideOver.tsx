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
import { ChartData } from 'chart.js'
import EmployeeLookupModal from './EmployeeLookupModal'

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
  grade?: string
  total_mm_value?: number
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

// 현재 날짜 관련 상수를 컴포넌트 외부에서 선언
const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;

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
  const [downPayment, setDownPayment] = useState<string>('')  // 착수금
  const [intermediatePayments, setIntermediatePayments] = useState<string[]>(['']) // 중도금
  const [finalPayment, setFinalPayment] = useState<string>('') // 잔금
  
  // 정기 결제형 정보
  const [periodicUnit, setPeriodicUnit] = useState<'month' | 'week'>('month')
  const [periodicInterval, setPeriodicInterval] = useState<string>('')
  const [periodicAmount, setPeriodicAmount] = useState<string>('')

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManpowerModal]);

  // 프로젝트 데이터로 폼 초기화
  useEffect(() => {
    if (mode === 'edit' && project?.id) {
      const fetchProjectData = async () => {
        try {
          const { data: projectData, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', project.id)
            .single();

          if (error) throw error;

          // 기본 정보 설정
          setTitle(projectData.name || '');
          setStatus(projectData.status || '');
          setMajorCategory(projectData.major_category || '');
          setCategory(projectData.category || '');
          setStartDate(projectData.start_date ? new Date(projectData.start_date) : null);
          setEndDate(projectData.end_date ? new Date(projectData.end_date) : null);
          setBudget(projectData.budget ? projectData.budget.toLocaleString() : '');
          
          // 계약 정보 설정
          if (projectData.contract_type) {
            setContractType(projectData.contract_type);
            setIsVatIncluded(projectData.is_vat_included || false);
            setCommonExpense(projectData.common_expense?.toLocaleString() || '');

            // 회차 정산형 정보
            if (projectData.contract_type === '회차 정산형') {
              setDownPayment(projectData.down_payment?.toLocaleString() || '');
              setIntermediatePayments(
                (projectData.intermediate_payments || []).map(p => p?.toLocaleString() || '')
              );
              setFinalPayment(projectData.final_payment?.toLocaleString() || '');
            }
            
            // 정기 결제형 정보
            if (projectData.contract_type === '정기 결제형') {
              setPeriodicUnit(projectData.periodic_unit || 'month');
              setPeriodicInterval(projectData.periodic_interval?.toString() || '');
              setPeriodicAmount(projectData.periodic_amount?.toLocaleString() || '');
            }
          }

          // 공수 정보 설정
          setManpowerPlanning(projectData.planning_manpower || null);
          setManpowerDesign(projectData.design_manpower || null);
          setManpowerPublishing(projectData.publishing_manpower || null);
          setManpowerDevelopment(projectData.development_manpower || null);

        } catch (error) {
          console.error('Error fetching project data:', error);
          toast.error('프로젝트 데이터 로딩 중 오류가 발생했습니다.');
        }
      };

      fetchProjectData();
    }
  }, [mode, project?.id]);

  // 실무자 데이터 가져오기
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        // 1. 먼저 모든 projects 데이터의 id를 가져옵니다
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id');

        const projectIds = projectsData?.map(p => p.id) || [];

        // 2. project_manpower 테이블에서 사용 중인 worker_ids를 가져옵니다
        const { data: usedWorkers } = await supabase
          .from('project_manpower')
          .select('worker_id')
          .in('project_id', projectIds);

        const usedWorkerIds = new Set(usedWorkers?.map(w => w.worker_id) || []);

        // 3. workers 테이블에서 사용되지 않은 worker 데이터를 가져옵니다 (grade 포함)
        const { data: workersData, error: workersError } = await supabase
          .from('workers')
          .select('id, name, job_type, grade')
          .is('deleted_at', null)
          .not('id', 'in', `(${Array.from(usedWorkerIds).join(',')})`);

        if (workersError) {
          console.error('Error fetching workers:', workersError);
          return;
        }

        if (!workersData) {
          console.error('No workers data found');
          return;
        }

        // 4. 상태 업데이트
        setWorkers(workersData.map(worker => ({
          id: worker.id,
          name: worker.name,
          job_type: worker.job_type || '',
          grade: worker.grade || ''
        })));

      } catch (error) {
        console.error('Error in fetchWorkers:', error);
        toast.error('실무자 목록을 불러오는데 실패했습니다.');
      }
    };
    
    fetchWorkers();
  }, [project?.id]); // project.id가 변경될 때마다 실행

  // 검색어에 맞는 실무자 필터링
  const getFilteredWorkers = (jobType: string) => {
    // 검색어가 있는 경우 검색어로 필터링
    const searchTerm = searchTerms[jobType]?.toLowerCase() || '';
    
    return workers.filter(worker => {
      // 이름으로 검색 필터링
      const nameMatch = worker.name.toLowerCase().includes(searchTerm);
      
      // 직무별 필터링
      let jobTypeMatch = false;
      switch(jobType) {
        case 'BD(BM)':
          jobTypeMatch = ['BD', 'BM'].includes(worker.grade || '');
          break;
        case 'PM(PL)': 
          // PM(PL)은 모든 job_type 허용 (기획, 디자인, 퍼블리싱, 개발, 기타)
          jobTypeMatch = ['기획', '디자인', '퍼블리싱', '개발', '기타'].includes(worker.job_type);
          break;
        case '기획':
          jobTypeMatch = worker.job_type === '기획';
          break;
        case '디자이너':
          jobTypeMatch = worker.job_type === '디자인';
          break;
        case '퍼블리셔':
          jobTypeMatch = worker.job_type === '퍼블리싱';
          break;
        case '개발':
          jobTypeMatch = worker.job_type === '개발';
          break;
        default:
          jobTypeMatch = false;
      }

      return nameMatch && jobTypeMatch;
    })
  };

  // 실무자 선택 핸들러 수정
  const handleWorkerSelect = async (jobType: string, worker: { id: string; name: string; job_type?: string }) => {
    try {
      // 신규 모드일 때는 UI만 업데이트
      if (mode === 'create') {
        const newWorker = {
          id: worker.id,
          name: worker.name,
          job_type: worker.job_type || '',
          grade: '',
          position: '',
          unit_price: 0,
          monthlyEfforts: {},
          total_mm_value: 0
        };

        setSelectedWorkers(prev => ({
          ...prev,
          [jobType]: [...(prev[jobType] || []), newWorker]
        }));

        setSearchTerms(prev => ({ ...prev, [jobType]: '' }));
        handleCloseDropdown(jobType);
        return;
      }

      // 기존 수정 모드 로직은 그대로 유지
      if (project?.id) {
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
      const projectData: any = {
        name: title.trim(),
        status: status || null,
        major_category: majorCategory || null,
        category: category || null,
        start_date: startDate?.toISOString().split('T')[0] || null,
        end_date: endDate?.toISOString().split('T')[0] || null,
        budget: budget ? Number(budget.replace(/[^\d]/g, '')) : null,
        contract_type: contractType || null,
        is_vat_included: isVatIncluded,
        common_expense: commonExpense ? parseInt(commonExpense.replace(/[^\d]/g, '')) : null,
        
        // 회차 정산형 정보
        down_payment: contractType === '회차 정산형' && downPayment ? 
          parseInt(downPayment.replace(/[^\d]/g, '')) : null,
        intermediate_payments: contractType === '회차 정산형' ? 
          intermediatePayments
            .filter(p => p.trim() !== '')
            .map(p => parseInt(p.replace(/[^\d]/g, ''))) : null,
        final_payment: contractType === '회차 정산형' && finalPayment ? 
          parseInt(finalPayment.replace(/[^\d]/g, '')) : null,
        
        // 정기 결제형 정보
        periodic_unit: contractType === '정기 결제형' ? periodicUnit : null,
        periodic_interval: contractType === '정기 결제형' && periodicInterval ? 
          parseInt(periodicInterval) : null,
        periodic_amount: contractType === '정기 결제형' && periodicAmount ? 
          parseInt(periodicAmount.replace(/[^\d]/g, '')) : null,
      };

      // 공수 정보 추가
      if (manpowerPlanning !== null) projectData.planning_manpower = manpowerPlanning;
      if (manpowerDesign !== null) projectData.design_manpower = manpowerDesign;
      if (manpowerPublishing !== null) projectData.publishing_manpower = manpowerPublishing;
      if (manpowerDevelopment !== null) projectData.development_manpower = manpowerDevelopment;

      if (mode === 'create') {
        // 1. 새 프로젝트 생성
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert([projectData])
          .select()
          .single();

        if (projectError) throw projectError;

        // 2. 직무별 실무자 데이터 추가 (신규 추가 시에도 동작하도록 수정)
        if (newProject?.id) {
          const manpowerData = Object.entries(selectedWorkers).flatMap(([role, workers]) =>
            workers.map(worker => ({
              project_id: newProject.id,
              worker_id: worker.id,
              role: role
            }))
          );

          if (manpowerData.length > 0) {
            const { error: manpowerError } = await supabase
              .from('project_manpower')
              .insert(manpowerData);

            if (manpowerError) throw manpowerError;
          }
        }

        onSubmit(newProject);
        
        // 폼 초기화
        setTitle('');
        setStatus('');
        setMajorCategory('');
        setCategory('');
        setStartDate(null);
        setEndDate(null);
        setBudget('');
        setContractType('회차 정산형');
        setIsVatIncluded(false);
        setCommonExpense('');
        setDownPayment('');
        setIntermediatePayments(['']);
        setFinalPayment('');
        setPeriodicUnit('month');
        setPeriodicInterval('');
        setPeriodicAmount('');
        setManpowerPlanning(null);
        setManpowerDesign(null);
        setManpowerPublishing(null);
        setManpowerDevelopment(null);
        setSelectedWorkers({
          'BD(BM)': [],
          'PM(PL)': [],
          '기획': [],
          '디자이너': [],
          '퍼블리셔': [],
          '개발': []
        });

      } else if (project?.id) {
        // 수정 모드 코드는 기존과 동일하게 유지
        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id)
          .select()
          .single();

        if (error) throw error;
        onSubmit({ ...project, ...data });
      }

      toast.success(mode === 'create' ? '프로젝트가 생성되었습니다.' : '프로젝트가 수정되었습니다.');
      onClose(); // 슬라이드 닫기

    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error.message || '프로젝트 저장 중 오류가 발생했습니다.');
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
    try {
      setSelectedWorkers(updatedWorkers)
      await fetchWorkerEfforts()
      await fetchRoleEfforts()
    } catch (error) {
      console.error('Error updating manpower:', error)
      toast.error('공수 업데이트 중 오류가 발생했습니다.')
    }
  }

  // 로딩 상태 관리를 위한 state 추가
  const [isEffortsLoading, setIsEffortsLoading] = useState(false);
  const [hasEffortsError, setHasEffortsError] = useState(false);

  // 공수 데이터 로딩 함수 수정
  const fetchWorkerEfforts = async () => {
    if (!project?.id) return;
    
    setIsEffortsLoading(true);
    setHasEffortsError(false);
    
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

      if (data) {
        data.forEach(mp => {
          if (mp.workers && mp.role) {
            const currentMonthEffort = mp.project_monthly_efforts?.find(
              (effort: { year: number; month: number; mm_value: number }) => 
                effort.year === CURRENT_YEAR && effort.month === CURRENT_MONTH
            );

            if (workersByRole[mp.role]) {
              workersByRole[mp.role].push({
                id: mp.workers.id,
                name: mp.workers.name,
                job_type: mp.workers.job_type || '',
                total_mm_value: Number(currentMonthEffort?.mm_value) || 0
              });
            }
          }
        });
      }

      setSelectedWorkers(workersByRole);
    } catch (error) {
      console.error('Error fetching worker efforts:', error);
      setHasEffortsError(true);
      toast.error('공수 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsEffortsLoading(false);
    }
  };

  // 데이터 로딩 useEffect 수정
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isOpen && project?.id && mode === 'edit') {
        await fetchWorkerEfforts();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, project?.id, mode]);

  // 에러 발생 시 자동 재시도 로직
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    const retryFetch = () => {
      if (hasEffortsError && isOpen && project?.id && retryCount < MAX_RETRIES) {
        retryTimeout = setTimeout(() => {
          fetchWorkerEfforts();
          retryCount++;
        }, 3000); // 3초 후 재시도
      }
    };

    retryFetch();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [hasEffortsError, isOpen, project?.id]);

  // useEffect 추가
  useEffect(() => {
    if (project?.id) {
      fetchWorkerEfforts();
    }
  }, [project?.id]); // project.id가 변경될 때마다 실행

  // 프로젝트 데이터 로딩 부분 수정
  useEffect(() => {
    if (mode === 'edit' && project?.id) {
      const fetchProjectData = async () => {
        try {
          const { data: projectData, error } = await supabase
            .from('projects')
            .select(`
              *,
              project_manpower (
                id,
                role,
                grade,
                position,
                unit_price,
                workers (
                  id,
                  name,
                  job_type
                )
              )
            `)
            .eq('id', project.id)
            .single();

          if (error) throw error;

          if (projectData) {
            // 기본 정보 설정
            setTitle(projectData.name || '');
            setStatus(projectData.status || '');
            setMajorCategory(projectData.major_category || '');
            setCategory(projectData.category || '');
            setStartDate(projectData.start_date ? new Date(projectData.start_date) : null);
            setEndDate(projectData.end_date ? new Date(projectData.end_date) : null);
            setManpowerPlanning(projectData.planning_manpower || 0);
            setManpowerDesign(projectData.design_manpower || 0);
            setManpowerPublishing(projectData.publishing_manpower || 0);
            setManpowerDevelopment(projectData.development_manpower || 0);

            // 실무자 정보 설정
            const workersByRole = {
              'BD(BM)': [],
              'PM(PL)': [],
              '기획': [],
              '디자이너': [],
              '퍼블리셔': [],
              '개발': []
            };

            projectData.project_manpower?.forEach(mp => {
              if (mp.workers && mp.role) {
                workersByRole[mp.role].push({
                  id: mp.workers.id,
                  name: mp.workers.name,
                  job_type: mp.workers.job_type || '',
                  grade: mp.grade || '',
                  position: mp.position || '',
                  unit_price: mp.unit_price || 0,
                  total_mm_value: 0
                });
              }
            });

            setSelectedWorkers(workersByRole);
          }
        } catch (error) {
          console.error('Error fetching project data:', error);
          toast.error('프로젝트 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      };

      fetchProjectData();
    }
  }, [project?.id, mode]); // 의존성 배열 수정

  // useEffect 추가
  useEffect(() => {
    if (isOpen && openManpowerModal) {
      setShowManpowerModal(true)
    }
  }, [isOpen, openManpowerModal])



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

      // 3. 데이터 처리 및 유휴성 검사
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
          label: 'PM(PL)',
          data: months.map(month => monthlyEfforts['PM(PL)']?.[month] || 0),
          borderColor: '#FF3B9A',
          backgroundColor: 'rgba(255, 59, 154, 0.1)',
          tension: 0.4,
          fill: false
        },
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

  // 입력 필드 핸들러 수정
  const handlePaymentChange = (value: string, setter: (value: string) => void) => {
    const numericValue = value.replace(/[^\d,]/g, '')
    if (numericValue === '') {
      setter('')
      return
    }
    const number = parseInt(numericValue.replace(/,/g, ''))
    if (!isNaN(number)) {
      setter(number.toLocaleString())
    }
  }

  // 상태 추가 (기존 상태 선언부 근처에 추가)
  const [budget, setBudget] = useState<string>('');

  // budget 입력 핸들러 추가
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue) {
      const formattedValue = Number(numericValue).toLocaleString();
      setBudget(formattedValue);
    } else {
      setBudget('');
    }
  };

  // 현재 월의 공수 데이터를 가져오는 함수
  const fetchCurrentMonthEfforts = useCallback(async () => {
    if (!project?.id) return;
    
    try {
      const { data: projectData, error } = await supabase
        .from('project_manpower')
        .select(`
          id,
          role,
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

      const updatedWorkers = {
        'BD(BM)': [] as Worker[],
        'PM(PL)': [] as Worker[],
        '기획': [] as Worker[],
        '디자이너': [] as Worker[],
        '퍼블리셔': [] as Worker[],
        '개발': [] as Worker[]
      };

      projectData?.forEach((mp: { 
        role: keyof typeof updatedWorkers; 
        workers: { 
          id: string; 
          name: string; 
          job_type: string; 
        }; 
        project_monthly_efforts?: Array<{
          year: number;
          month: number;
          mm_value: number;
        }>;
      }) => {
        if (!mp.workers || !mp.role || !updatedWorkers[mp.role]) return;

        const currentMonthEffort = mp.project_monthly_efforts?.find(
          effort => effort.year === CURRENT_YEAR && effort.month === CURRENT_MONTH
        )?.mm_value || 0;

        updatedWorkers[mp.role].push({
          id: mp.workers.id,
          name: mp.workers.name,
          job_type: mp.workers.job_type,
          total_mm_value: currentMonthEffort
        });
      });

      setSelectedWorkers(updatedWorkers);
    } catch (error) {
      console.error('Error fetching monthly efforts:', error);
    }
  }, [project?.id]);

  // 공수 데이터 변경 시 자동 업데이트
  useEffect(() => {
    if (isOpen && project?.id) {
      fetchCurrentMonthEfforts();
    }
  }, [isOpen, project?.id, fetchCurrentMonthEfforts]);

  // AddManpowerModal에서 데이터 업데이트 시 호출될 핸들러
  const handleManpowerModalUpdate = useCallback(async () => {
    await fetchCurrentMonthEfforts();
  }, [fetchCurrentMonthEfforts]);

  // selectedWorkers가 변경될 때마다 그래프 데이터 업데이트
  useEffect(() => {
    const updateGraphData = async () => {
      if (project?.id) {
        try {
          const { data: monthlyData, error: monthlyError } = await supabase
            .from('project_monthly_efforts')
            .select(`
              id,
              year,
              month,
              mm_value,
              project_manpower!inner (
                role,
                project_id
              )
            `)
            .eq('project_manpower.project_id', project.id)

          if (monthlyError) throw monthlyError

          const monthlyEfforts: MonthlyEffort = {}
          
          monthlyData?.forEach((effort: any) => {
            const role = effort.project_manpower.role
            const monthKey = `${effort.year}-${String(effort.month).padStart(2, '0')}`
            
            if (!monthlyEfforts[role]) {
              monthlyEfforts[role] = {}
            }
            
            if (!monthlyEfforts[role][monthKey]) {
              monthlyEfforts[role][monthKey] = 0
            }
            
            monthlyEfforts[role][monthKey] += effort.mm_value || 0
          })

          setMonthlyEfforts(monthlyEfforts)
        } catch (error) {
          console.error('Error fetching monthly efforts:', error)
        }
      }
    }

    updateGraphData()
  }, [project?.id, selectedWorkers])

  // 모든 드롭다운 닫기 함수
  const closeAllDropdowns = () => {
    setIsStatusOpen(false);
    setIsMajorCategoryOpen(false);
    setIsCategoryOpen(false);
    setIsContractTypeOpen(false);
    setIsPeriodicUnitOpen(false);
  };

  // 특정 드롭다운 열기 함수
  const openDropdown = (setter: (value: boolean) => void) => {
    closeAllDropdowns();
    setter(true);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (majorCategoryRef.current && !majorCategoryRef.current.contains(event.target as Node)) {
        setIsMajorCategoryOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (contractTypeRef.current && !contractTypeRef.current.contains(event.target as Node)) {
        setIsContractTypeOpen(false);
      }
      if (periodicUnitRef.current && !periodicUnitRef.current.contains(event.target as Node)) {
        setIsPeriodicUnitOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 전체 공수 상태 추가
  const [totalEfforts, setTotalEfforts] = useState<{[key: string]: number}>({
    'PM(PL)': 0,
    '기획': 0,
    '디자이너': 0,
    '퍼블리셔': 0,
    '개발': 0
  });

  // 전체 공수 데이터 가져오기
  const fetchTotalEfforts = useCallback(async () => {
    if (!project?.id) return;

    try {
      const { data, error } = await supabase
        .from('project_manpower')
        .select(`
          role,
          project_monthly_efforts (
            mm_value
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;

      const totals = {
        'PM(PL)': 0,
        '기획': 0,
        '디자이너': 0,
        '퍼블리셔': 0,
        '개발': 0
      };

      data?.forEach(item => {
        if (item.role && item.project_monthly_efforts) {
          const roleEffort = item.project_monthly_efforts.reduce(
            (sum: number, effort: { mm_value: number }) => sum + (effort.mm_value || 0),
            0
          );
          if (totals.hasOwnProperty(item.role)) {
            totals[item.role] += roleEffort;
          }
        }
      });

      setTotalEfforts(totals);
    } catch (error) {
      console.error('Error fetching total efforts:', error);
    }
  }, [project?.id, supabase]);

  // useEffect 수정
  useEffect(() => {
    if (project?.id && mode === 'edit') {
      fetchTotalEfforts();
    }
  }, [project?.id, mode, fetchTotalEfforts]);

  // 컴포넌트 내부에 상태 추가
  const [showAllWorkersModal, setShowAllWorkersModal] = useState(false);
  const [showAvailableWorkersModal, setShowAvailableWorkersModal] = useState(false);

  return (
    <Transition.Root show={isOpen} as={Fragment}>

      {/* 공수 관리 모달 */}
      {showManpowerModal && (
        <AddManpowerModal
          isOpen={showManpowerModal}
          onClose={() => {
            setShowManpowerModal(false);
            fetchCurrentMonthEfforts(); // 모달이 닫힐 때도 데이터 업데이트
          }}
          projectId={project?.id || ''}
          startDate={startDate}
          endDate={endDate}
          selectedWorkers={selectedWorkers}
          onManpowerUpdate={handleManpowerModalUpdate}
        />
      )}

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
          if (!showManpowerModal && !showAllWorkersModal && !showAvailableWorkersModal) {
            onClose();
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

                          <div className={`px-4 pt-6 sm:px-6 space-y-6 project_formWrapper pb-[150px]`}>
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
                                    onClick={() => openDropdown(setIsStatusOpen)}
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
                                    onClick={() => openDropdown(setIsMajorCategoryOpen)}
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
                                    onClick={() => openDropdown(setIsCategoryOpen)}
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



                              {/* 직무별 실무자 */}
                              <div className="space-y-4 mt-[25px] pb-[15px]">
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
                                        
                                        {/* 유휴인력 검색 결과 드롭다운 */}
                                        {(searchTerms[jobType] || openDropdowns[jobType]) && (
                                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                            {!searchTerms[jobType] && (  // 검색어가 없을 때만 유휴인력 레이블 표시
                                              <div className="p-2 text-xs text-gray-500 border-b">
                                                [유휴인력]
                                              </div>
                                            )}
                                            <div className="max-h-48 overflow-y-auto">
                                              {getFilteredWorkers(jobType)
                                                .filter(worker => !selectedWorkers[jobType].some(w => w.id === worker.id))
                                                .map(worker => (
                                                  <div
                                                    key={worker.id}
                                                    className="px-2 py-2 hover:bg-gray-100 cursor-pointer text-[12px]"
                                                    onClick={() => {
                                                      handleWorkerSelect(jobType, { 
                                                        id: worker.id, 
                                                        name: worker.name,
                                                        job_type: worker.job_type 
                                                      });
                                                      handleCloseDropdown(jobType);
                                                    }}
                                                  >
                                                    <span>{worker.name}</span>
                                                    {worker.job_type && (
                                                      <span className="ml-2 text-gray-500">({worker.job_type})</span>
                                                    )}
                                                  </div>
                                                ))}
                                              {getFilteredWorkers(jobType)
                                                .filter(worker => !selectedWorkers[jobType].some(w => w.id === worker.id))
                                                .length === 0 && (
                                                <div className="px-4 py-2 text-gray-500 text-[12px]">
                                                  검색 결과가 없습니다.
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* 직무별 실무자 이름 표시 영역 */}
                                      <div className="flex-1 min-h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] bg-white overflow-x-auto whitespace-nowrap no-scrollbar">
                                        <div className="flex items-center gap-2 py-1">
                                          {selectedWorkers[jobType].map((worker) => (
                                            <div
                                              key={worker.id}
                                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm flex-shrink-0"
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
                                    </div>
                                  ))}
                                </div>
                                {/* 버튼 추가 */}
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowAllWorkersModal(true)}
                                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    전체 인력 확인
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowAvailableWorkersModal(true)}
                                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    유휴 인력 확인
                                  </button>
                                </div>

                              </div>

                              {/* 직무별 전체 투입 인원 섹션 */}
                              <div className="mt-6 border-gray-200 pt-6">
                                <div className="text-black text-[16px] font-normal leading-[19.09px] mb-4">직무별 전체 투입 인원</div>
                                <div className="grid grid-cols-2 gap-4">
                                  {/* PM(PL) */}
                                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                                    <div className="text-[14px] text-gray-600">PM(PL)</div>
                                    <div className="text-[16px] font-semibold">
                                      {selectedWorkers['PM(PL)']?.length || 0}
                                      <span className="text-[12px] text-gray-500 ml-1">명</span>
                                    </div>
                                  </div>

                                  {/* 기획 */}
                                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                                    <div className="text-[14px] text-gray-600">기획</div>
                                    <div className="text-[16px] font-semibold">
                                      {selectedWorkers['기획']?.length || 0}
                                      <span className="text-[12px] text-gray-500 ml-1">명</span>
                                    </div>
                                  </div>

                                  {/* 디자이너 */}
                                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                                    <div className="text-[14px] text-gray-600">디자이너</div>
                                    <div className="text-[16px] font-semibold">
                                      {selectedWorkers['디자이너']?.length || 0}
                                      <span className="text-[12px] text-gray-500 ml-1">명</span>
                                    </div>
                                  </div>

                                  {/* 퍼블리셔 */}
                                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                                    <div className="text-[14px] text-gray-600">퍼블리셔</div>
                                    <div className="text-[16px] font-semibold">
                                      {selectedWorkers['퍼블리셔']?.length || 0}
                                      <span className="text-[12px] text-gray-500 ml-1">명</span>
                                    </div>
                                  </div>

                                  {/* 개발 */}
                                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                                    <div className="text-[14px] text-gray-600">개발</div>
                                    <div className="text-[16px] font-semibold">
                                      {selectedWorkers['개발']?.length || 0}
                                      <span className="text-[12px] text-gray-500 ml-1">명</span>
                                    </div>
                                  </div>

                                  {/* 전체 합계 */}
                                  <div className="bg-[#4E49E7] text-white rounded-lg p-4 flex justify-between items-center">
                                    <div className="text-[14px]">전체</div>
                                    <div className="text-[16px] font-semibold">
                                      {Object.entries(selectedWorkers)
                                        .filter(([key]) => ['PM(PL)', '기획', '디자이너', '퍼블리셔', '개발'].includes(key))
                                        .reduce((acc, [_, workers]) => acc + (workers?.length || 0), 0)}
                                      <span className="text-[12px] ml-1">명</span>
                                    </div>
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
                                {/* 계약 유형 */}
                                <div className="relative" ref={contractTypeRef}>
                                  <button
                                    type="button"
                                    onClick={() => openDropdown(setIsContractTypeOpen)}
                                    className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus:border-[#4E49E7] focus:ring-0 focus:bg-gray-50 transition-all duration-200 py-2 text-left flex items-center justify-between"
                                  >
                                    <span className="text-gray-400 font-bold text-gray-500">
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

                                    {/* 계약 금액 */}
                                    <div className="relative">
                                      <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                        <input
                                          type="text"
                                          value={budget}
                                          onChange={handleBudgetChange}
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



                                    {/* 착수금 */}
                                    <div className="relative">
                                      <div className="w-full border-0 border-b-2 border-transparent bg-transparent text-1xl font-medium text-gray-900 focus-within:border-[#4E49E7] focus-within:bg-gray-50 transition-all duration-200 py-2 flex items-center">
                                        <input
                                          type="text"
                                          value={downPayment}
                                          onChange={(e) => handlePaymentChange(e.target.value, setDownPayment)}
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
                                              onChange={(e) => handlePaymentChange(e.target.value, (value) => {
                                                const newPayments = [...intermediatePayments]
                                                newPayments[index] = value
                                                setIntermediatePayments(newPayments)
                                              })}
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
                                          onChange={(e) => handlePaymentChange(e.target.value, setFinalPayment)}
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
                                            onClick={() => openDropdown(setIsPeriodicUnitOpen)}
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
                                          onChange={(e) => handlePaymentChange(e.target.value, setPeriodicAmount)}
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
                                              label: 'PM(PL)',
                                              data: startDate && endDate ? 
                                                getMonthsBetween(startDate, endDate)
                                                  .map(month => monthlyEfforts['PM(PL)']?.[month] || 0) : [],
                                              borderColor: '#FF3B9A',
                                              backgroundColor: 'rgba(255, 59, 154, 0.1)',
                                              tension: 0.4,
                                              fill: false
                                            },
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
                          <div className={`bottom-0 w-[100%] bg-white border-t border-gray-200 project_btnWrapper fixed bottom-0 right-0 w-screen max-w-6xl z-10`}>
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
                                  onClick={() => window.open('https://eluo-sn-projects-six.vercel.app/', '_blank')}
                                >
                                  요건 등록 및 확인
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 전체 공수 섹션 */}
                          <h4 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mt-8 mb-6">
                              전체 공수
                            </h4>
                          <div className=" bg-[#F8F8F8] rounded-[8px] p-6">
                            <div className="flex justify-center flex-wrap gap-8">
                              {Object.entries(totalEfforts).map(([role, value]) => value > 0 && (
                                <div key={role} className="flex flex-col items-center">
                                  <span className="font-pretendard font-bold text-[32px] leading-[38.19px] text-black mb-2">
                                    {Number(value.toFixed(10)).toString()}
                                  </span>
                                  <span className="font-pretendard font-normal text-[13px] leading-[16.71px] text-[#666666]">
                                    {role}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 해당월 공수진행 섹션 */}
                          <div className="mt-8">
                            {/* 타이틀 */}
                            <h4 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mb-4">
                              {currentMonth}월 진행 공수
                            </h4>

                            {mode === 'create' && (
                              <div className="flex items-center justify-center h-[100px] border border-gray-200 rounded-lg mb-4">
                                <p className="text-red-500 text-sm font-medium">프로젝트 추가 후 공수 추가 가능합니다.</p>
                              </div>
                            )}

                            {/* 직무별 공수 목록 */}
                            <div className="space-y-4 flex flex-row items-baseline gap-2 flex-wrap">
                              {/* PM(PL) */}
                              {selectedWorkers['PM(PL)']?.length > 0 && (
                                <div className="w-[100%]">
                                  <span className="font-pretendard font-bold text-[16px] leading-[19.09px] text-[#666666] block">
                                    PM(PL)
                                  </span>
                                  <ul className="space-y-1 rounded-[8px] p-4">
                                    {selectedWorkers['PM(PL)'].map(worker => (
                                      <li key={worker.id} className="flex relative pl-3 gap-4">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A] min-w-[100px]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {Number(worker.total_mm_value?.toFixed(3)).toString().replace(/\.?0+$/, '')}
                                          </span>
                                          <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 기획 */}
                              {selectedWorkers['기획']?.length > 0 && (
                                <div className="w-[100%]">
                                  <span className="font-pretendard font-bold text-[16px] leading-[19.09px] text-[#666666] block">
                                    기획
                                  </span>
                                  <ul className="space-y-1 rounded-[8px] p-4">
                                    {selectedWorkers['기획'].map(worker => (
                                      <li key={worker.id} className="flex relative pl-3 gap-4">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A] min-w-[100px]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {Number(worker.total_mm_value?.toFixed(3)).toString().replace(/\.?0+$/, '')}
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
                                  <span className="font-pretendard font-bold text-[16px] leading-[19.09px] text-[#666666] block">
                                    디자이너
                                  </span>
                                  <ul className="space-y-1 rounded-[8px] p-4">
                                    {selectedWorkers['디자이너'].map(worker => (
                                      <li key={worker.id} className="flex relative pl-3 gap-4">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A] min-w-[100px]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {Number(worker.total_mm_value?.toFixed(3)).toString().replace(/\.?0+$/, '')}
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
                                  <span className="font-pretendard font-bold text-[16px] leading-[19.09px] text-[#666666] block">
                                    퍼블리셔
                                  </span>
                                  <ul className="space-y-1 rounded-[8px] p-4">
                                    {selectedWorkers['퍼블리셔'].map(worker => (
                                      <li key={worker.id} className="flex relative pl-3 gap-4">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A] min-w-[100px]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {Number(worker.total_mm_value?.toFixed(3)).toString().replace(/\.?0+$/, '')}
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
                                  <span className="font-pretendard font-bold text-[16px] leading-[19.09px] text-[#666666] block">
                                    개발
                                  </span>
                                  <ul className="space-y-1 rounded-[8px] p-4">
                                    {selectedWorkers['개발'].map(worker => (
                                      <li key={worker.id} className="flex relative pl-3 gap-4">
                                        <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                                        <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A] min-w-[100px]">
                                          {worker.name}
                                        </span>
                                        <div className="flex items-baseline">
                                          <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">
                                            {Number(worker.total_mm_value?.toFixed(3)).toString().replace(/\.?0+$/, '')}
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

      {/* 모달 컴포넌트 추가 */}
      <EmployeeLookupModal
        isOpen={showAllWorkersModal}
        onClose={() => setShowAllWorkersModal(false)}
        mode="all"
      />
      <EmployeeLookupModal
        isOpen={showAvailableWorkersModal}
        onClose={() => setShowAvailableWorkersModal(false)}
        mode="available"
      />

    </Transition.Root>
  )
} 