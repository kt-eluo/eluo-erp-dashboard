'use client'

import { useState, useEffect, Fragment, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { ProjectStatus, ProjectManpower, ProjectCategory, ProjectMajorCategory } from '@/types/project'
import { Search, Plus, LayoutGrid, Table, FileSpreadsheet, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AddProjectSlideOver from '@/components/projects/AddProjectSlideOver'
import { Dialog, Transition } from '@headlessui/react'
import AddManpowerModal from '@/components/projects/AddManpowerModal'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'

const ITEMS_PER_PAGE = 20

// 로딩 스피너 컴포넌트 분리
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 border-t-[#4E49E7] animate-spin" />
  </div>
)

interface ExtendedProject {
  id: string;
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  major_category: ProjectMajorCategory;
  category: ProjectCategory;
  start_date: string | null;
  end_date: string | null;
  project_manpower: ProjectManpower[];
  planning_manpower: number | null;
  design_manpower: number | null;
  publishing_manpower: number | null;
  development_manpower: number | null;
  budget?: number;
  manpower?: {
    [key: string]: Array<{
      name: string;
      worker_type: '협력사임직원' | '프리랜서(기업)' | '프리랜서(개인)';
    }>;
  };
}

interface AddProjectSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: ExtendedProject & { _action?: 'delete' }) => Promise<void>;
  project?: ExtendedProject | null;
  mode?: 'create' | 'edit';
  openManpowerModal?: boolean;
}

interface LocalProjectManpower {
  id: string;
  role: keyof typeof workersByRole;
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
}

interface Worker {
  id: string;
  name: string;
  job_type: string;
  worker_type: '협력사임직원' | '프리랜서(기업)' | '프리랜서(개인)';
  total_mm_value?: number;
}

const workersByRole: {
  'BD(BM)': Worker[];
  'PM(PL)': Worker[];
  '기획': Worker[];
  '디자이너': Worker[];
  '퍼블리셔': Worker[];
  '개발': Worker[];
} = {
  'BD(BM)': [],
  'PM(PL)': [],
  '기획': [],
  '디자이너': [],
  '퍼블리셔': [],
  '개발': []
};

// Worker type 색상 매핑 추가
const WORKER_TYPE_COLORS = {
  '협력사임직원': '#3DAF07',
  '프리랜서(기업)': '#1D89EA',
  '프리랜서(개인)': '#FF00BF'
} as const;

// 필터 모달 컴포넌트
const FilterModal = ({ 
  isOpen, 
  onClose, 
  onApply,
  onReset
}: { 
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  onReset: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [majorCategory, setMajorCategory] = useState<ProjectMajorCategory | ''>('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [workerName, setWorkerName] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    onApply({
      startDate,
      endDate,
      status,
      majorCategory,
      category,
      workerName
    });
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setStatus('');
    setMajorCategory('');
    setCategory('');
    setWorkerName('');
    onReset();
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      ref={modalRef} 
      className={`absolute top-[calc(100%+8px)] right-0 w-[400px] bg-white rounded-lg shadow-lg border border-gray-200 p-6 z-50
        transition-all duration-300 ease-out transform
        ${isOpen 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
        }
      `}
    >
      {/* 프로젝트 기간 */}
      <div className="mb-6">
        <h3 className="text-[14px] font-medium text-gray-900 mb-3">프로젝트 기간</h3>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            locale={ko}
            dateFormat="yyyy.MM.dd"
            placeholderText="날짜를 입력해주세요"
            className="w-full h-[38px] px-3 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-500">~</span>
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            locale={ko}
            dateFormat="yyyy.MM.dd"
            placeholderText="날짜를 입력해주세요"
            className="w-full h-[38px] px-3 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* 프로젝트 상태 */}
      <div className="mb-6">
        <h3 className="text-[14px] font-medium text-gray-900 mb-3">프로젝트 상태</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="w-full h-[38px] px-3 border border-gray-300 rounded-md text-sm"
        >
          <option value="">선택해주세요</option>
          {['준비중', '진행중', '완료', '보류'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* 프로젝트 대분류 */}
      <div className="mb-6">
        <h3 className="text-[14px] font-medium text-gray-900 mb-3">프로젝트 대분류</h3>
        <select
          value={majorCategory}
          onChange={(e) => setMajorCategory(e.target.value as ProjectMajorCategory)}
          className="w-full h-[38px] px-3 border border-gray-300 rounded-md text-sm"
        >
          <option value="">선택해주세요</option>
          {['금융', '커머스', 'AI', '기타'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 프로젝트 카테고리 */}
      <div className="mb-6">
        <h3 className="text-[14px] font-medium text-gray-900 mb-3">프로젝트 카테고리</h3>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProjectCategory)}
          className="w-full h-[38px] px-3 border border-gray-300 rounded-md text-sm"
        >
          <option value="">선택해주세요</option>
          {['운영', '구축', '개발', '기타'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 프로젝트 투입 실무자 */}
      <div className="mb-6">
        <h3 className="text-[14px] font-medium text-gray-900 mb-3">프로젝트 투입 실무자</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            placeholder="실무자 이름을 입력하세요"
            className="flex-1 h-[38px] px-3 border border-gray-300 rounded-md text-sm"
          />
          <button
            onClick={() => handleApply()}
            className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-700 hover:bg-gray-200"
          >
            검색
          </button>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          닫기
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            필터 초기화
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-[#4E49E7] text-white rounded-md text-sm hover:bg-[#3F3ABE]"
          >
            필터 적용하기
          </button>
        </div>
      </div>
    </div>
  );
};

// 필터 값 타입 정의
interface FilterValues {
  startDate: Date | null;
  endDate: Date | null;
  status: ProjectStatus | '';
  majorCategory: ProjectMajorCategory | '';
  category: ProjectCategory | '';
  workerName: string;
}

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState<ExtendedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all')
  const [viewType, setViewType] = useState<'table' | 'card'>('card')
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all')
  const [isAddSlideOverOpen, setIsAddSlideOverOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ExtendedProject | null>(null)
  const [isDetailSlideOverOpen, setIsDetailSlideOverOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [showManpowerModal, setShowManpowerModal] = useState(false)
  const [selectedWorkers, setSelectedWorkers] = useState<{
    [key: string]: Array<{ id: string; name: string; job_type: string }>
  }>({})
  const [currentProjectId, setCurrentProjectId] = useState<string>('')
  const [projectDates, setProjectDates] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null })
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    startDate: null,
    endDate: null,
    status: '',
    majorCategory: '',
    category: '',
    workerName: ''
  });

  const statusTypes: ProjectStatus[] = ['준비중', '진행중', '완료', '보류']
  const categoryTypes: ProjectCategory[] = ['운영', '구축', '개발', '기타']

  // 공수 추가 버튼 클릭 핸들러
  const handleAddManpowerClick = () => {
    setShowManpowerModal(true)
  }

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      let query = supabase
        .from('projects')
        .select(`
          *,
          project_manpower (
            id,
            role,
            workers (
              id,
              name,
              job_type,
              worker_type
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        const transformedData = data.map(project => ({
          ...project,
          manpower: project.project_manpower?.reduce((acc: { [key: string]: Array<{ name: string; worker_type: string }> }, mp: any) => {
            if (mp.workers && mp.role) {
              if (!acc[mp.role]) acc[mp.role] = [];
              acc[mp.role].push({
                name: mp.workers.name,
                worker_type: mp.workers.worker_type
              });
            }
            return acc;
          }, {})
        }))
        setProjects(transformedData as ExtendedProject[])
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error.message || error)
      toast.error('프로젝트 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setSearchTerm(searchInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleProjectSubmit = async (projectData: ExtendedProject & { _action?: 'delete' }) => {
    try {
      if (projectData._action === 'delete') {
        // 삭제 로직
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectData.id)

        if (error) throw error
        toast.success('프로젝트가 삭제되었습니다.')
        fetchProjects()
        return
      }

      // 프로젝트 목록 새로고침만 수행
      await fetchProjects()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('프로젝트 저장 중 오류가 발생했습니다.')
    }
  }

  const handleProjectDetail = async (project: ExtendedProject) => {
    try {
      // 먼저 기본 데이터로 슬라이드오버를 열고
      setSelectedProject(project);
      setIsDetailSlideOverOpen(true);

      // 그 다음 상세 데이터를 가져옴
      const { data: projectData, error } = await supabase
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
            project_monthly_efforts (
              year,
              month,
              mm_value
            )
          )
        `)
        .eq('id', project.id)
        .single();

      if (error) throw error;

      if (projectData) {
        // 데이터를 받아온 후 상태 업데이트
        setSelectedProject({
          ...projectData,
          project_manpower: projectData.project_manpower || []
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('프로젝트 상세 정보를 불러오는데 실패했습니다.');
    }
  };

  // 카테고리 변경 핸들러 수정
  const handleCategoryChange = async (category: ProjectCategory | 'all') => {
    try {
      setIsLoading(true);
      
      // 필터 초기화
      setActiveFilters({
        startDate: null,
        endDate: null,
        status: '',
        majorCategory: '',
        category: '',
        workerName: ''
      });

      setSelectedCategory(category);
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          project_manpower (
            id,
            role,
            workers (
              id,
              name,
              job_type,
              worker_type
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const transformedData = data.map(project => ({
          ...project,
          manpower: project.project_manpower?.reduce((acc: { [key: string]: Array<{ name: string; worker_type: string }> }, mp: any) => {
            if (mp.workers && mp.role) {
              if (!acc[mp.role]) acc[mp.role] = [];
              acc[mp.role].push({
                name: mp.workers.name,
                worker_type: mp.workers.worker_type
              });
            }
            return acc;
          }, {})
        }));
        setProjects(transformedData as ExtendedProject[]);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error.message || error);
      toast.error('프로젝트 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast.success('프로젝트가 삭제되었습니다.')
      fetchProjects() // 목록 새로고침
    } catch (error: any) {
      console.error('Error:', error.message || error)
      toast.error('프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [selectedCategory, selectedStatus, searchTerm])

  useEffect(() => {
    // URL 파라미터 확인
    const params = new URLSearchParams(window.location.search)
    const shouldEdit = params.get('edit') === 'true'
    const projectId = params.get('projectId')

    if (shouldEdit && projectId) {
      // 프로젝트 데이터 가져오기
      const fetchProject = async () => {
        try {
          const { data: projectData, error } = await supabase
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
                project_monthly_efforts (
                  year,
                  month,
                  mm_value
                )
              )
            `)
            .eq('id', projectId)
            .single();

          // 에러 체크를 먼저 수행
          if (error) {
            console.error('Error details:', error);
            throw new Error(`Failed to fetch project: ${error.message}`);
          }

          // 데이터가 없는 경우 체크
          if (!projectData) {
            throw new Error('Project not found');
          }

          setSelectedProject(projectData);

          // 실무자 데이터 처리
          projectData.project_manpower?.forEach((mp: LocalProjectManpower) => {
            if (mp.workers && mp.role) {
              const totalEffort = mp.project_monthly_efforts?.reduce((sum: number, effort) => {
                return sum + (Number(effort.mm_value) || 0);
              }, 0) || 0;

              workersByRole[mp.role].push({
                id: mp.workers.id,
                name: mp.workers.name,
                job_type: mp.workers.job_type || '',
                worker_type: mp.workers.worker_type,
                total_mm_value: totalEffort
              });
            }
          });

          setSelectedWorkers(workersByRole);
          setCurrentProjectId(projectData.id);
          setProjectDates({
            startDate: projectData.start_date ? new Date(projectData.start_date) : null,
            endDate: projectData.end_date ? new Date(projectData.end_date) : null
          });
          setShowManpowerModal(true);
        } catch (error) {
          // 구체적인 에러 메시지 출력
          console.error('Error fetching project:', {
            error,
            projectId,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
          toast.error('프로젝트 정보를 불러오는데 실패했습니다.');
        }
      }

      fetchProject()
      
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // URL 파라미터 확인하는 useEffect 추가
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isEdit = params.get('edit') === 'true';
    const projectId = params.get('projectId');

    if (isEdit && projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        setIsDetailSlideOverOpen(true);
      }
    }
  }, [projects]);

  // 현재 페이지의 데이터만 가져오는 함수
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return projects.slice(startIndex, endIndex)
  }

  // 총 페이지 수 계산
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE)

  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    // 프로젝트가 시작되지 않은 경우
    if (now < start) return 0;
    // 프로젝트가 종료된 경우
    if (now > end) return 100;

    // 진행률 계산
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100); // 0~100 사이 값으로 제한
  };

  // 실무자 공수 관리 버튼 클릭 핸들러 추가
  const handleManpowerClick = async (project: ExtendedProject) => {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_manpower (
            id,
            worker_id,
            role,
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

      // 직무별 실무자 데이터 정리
      const workersByRole = {
        'BD(BM)': [],
        'PM(PL)': [],
        '기획': [],
        '디자이너': [],
        '퍼블리셔': [],
        '개발': []
      };

      projectData.project_manpower?.forEach((mp: LocalProjectManpower) => {
        if (mp.workers) {
          workersByRole[mp.role].push({
            id: mp.workers.id,
            name: mp.workers.name,
            job_type: mp.workers.job_type || '',
            worker_type: mp.workers.worker_type
          });
        }
      });

      // 상태 업데이트
      setSelectedWorkers(workersByRole);
      setCurrentProjectId(project.id);
      setProjectDates({
        startDate: project.start_date ? new Date(project.start_date) : null,
        endDate: project.end_date ? new Date(project.end_date) : null
      });
      setShowManpowerModal(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 필터 적용 함수
  const handleApplyFilters = async (filters: FilterValues) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('projects')
        .select(`
          *,
          project_manpower (
            id,
            role,
            workers (
              id,
              name,
              job_type,
              worker_type
            )
          )
        `)
        .order('created_at', { ascending: false });

      // 날짜 필터
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate.toISOString());
      }

      // 상태 필터
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // 대분류 필터
      if (filters.majorCategory) {
        query = query.eq('major_category', filters.majorCategory);
      }

      // 카테고리 필터
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // 실무자 필터
      if (filters.workerName) {
        const { data: workerIds, error: workerError } = await supabase
          .from('workers')
          .select('id')
          .ilike('name', `%${filters.workerName}%`);

        if (workerError) throw workerError;

        // 검색된 실무자가 없는 경우 빈 배열 반환
        if (!workerIds || workerIds.length === 0) {
          setProjects([]);
          setActiveFilters(filters);
          setIsFilterModalOpen(false);
          toast.success('필터 내용이 적용되었어요.');
          setIsLoading(false);
          return;
        }

        const { data: projectIds, error: projectError } = await supabase
          .from('project_manpower')
          .select('project_id')
          .in('worker_id', workerIds.map(w => w.id));

        if (projectError) throw projectError;

        // 검색된 프로젝트가 없는 경우 빈 배열 반환
        if (!projectIds || projectIds.length === 0) {
          setProjects([]);
          setActiveFilters(filters);
          setIsFilterModalOpen(false);
          toast.success('필터 내용이 적용되었어요.');
          setIsLoading(false);
          return;
        }

        query = query.in('id', [...new Set(projectIds.map(p => p.project_id))]);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const transformedData = data.map(project => ({
          ...project,
          manpower: project.project_manpower?.reduce((acc: { [key: string]: Array<{ name: string; worker_type: string }> }, mp: any) => {
            if (mp.workers && mp.role) {
              if (!acc[mp.role]) acc[mp.role] = [];
              acc[mp.role].push({
                name: mp.workers.name,
                worker_type: mp.workers.worker_type
              });
            }
            return acc;
          }, {})
        }));
        setProjects(transformedData as ExtendedProject[]);
      }

      setActiveFilters(filters);
      setIsFilterModalOpen(false);
      toast.success('필터 내용이 적용되었어요.');
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('필터 적용 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 초기화 함수
  const handleResetFilters = () => {
    setActiveFilters({
      startDate: null,
      endDate: null,
      status: '',
      majorCategory: '',
      category: '',
      workerName: ''
    });
    fetchProjects();
  };

  if (isLoading) {
    return (
      <LoadingSpinner />
    )
  }

  return (
    <div className="">
      <div className="p-4 sm:p-6 bg-white min-h-screen">
        {/* 헤더 영역 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-[18px] sm:text-[20px] font-semibold">프로젝트 관리</h1>
          <div className="flex items-center gap-3">
            {/* 엑셀 파일 버튼 */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-[12px] font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              파일
            </button>
            
            {/* 필터 버튼 */}
            <div className="relative">
              <button 
                onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-[12px] font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <Filter className="w-4 h-4 mr-2" />
                필터
              </button>
              
              {/* 필터 모달 */}
              <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </div>

            {/* 추가 버튼 */}
            <button
              onClick={() => setIsAddSlideOverOpen(true)}
              className="inline-flex items-center px-3 sm:px-4 py-2 text-[12px] bg-[#4E49E7] text-white rounded-lg hover:bg-[#3F3ABE] transition-colors border border-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 프로젝트
            </button>
          </div>
        </div>

        {/* 검색 및 뷰 타입 전환 영역 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 검색창 */}
            <form onSubmit={handleSearch} className="relative flex w-full sm:w-[400px]">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#4E49E7] focus:border-[#4E49E7] text-[13px]"
                  placeholder="프로젝트 검색"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-[13px] text-black bg-white hover:text-white border border-gray-400 rounded-r-md hover:bg-[#4E49E7] transition-colors duration-200"
              >
                검색
              </button>
            </form>


            {/* 뷰 타입 전환 버튼 수정 */}
            <button 
              onClick={() => setViewType(viewType === 'card' ? 'table' : 'card')}
              className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {viewType === 'card' ? (
                <>
                  <Table className="w-4 h-4" />
                  테이블 형식
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  카드 형식
                </>
              )}
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${selectedCategory === 'all'
                  ? 'bg-[#4E49E7] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              전체
            </button>
            {categoryTypes.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${selectedCategory === category
                    ? 'bg-[#4E49E7] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {/* 안내 메시지 */}
        <div className="mb-6 text-[13px] sm:text-sm">
          <div className="flex items-center text-black-500 bg-gray-50 px-3 sm:px-4 py-3 rounded-lg">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            프로젝트는 기간에 따라 자동으로 상태가 설정돼요.
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {viewType === 'card' ? (
          <div>
            {/* 카드 뷰 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className="border border-[#CFCFCF] rounded-[8px] p-6 hover:border-[#4E49E7] transition-colors duration-200 cursor-pointer"
                  onClick={() => handleProjectDetail(project)}
                >
                  {/* 상단 영역: 프로젝트명과 삭제 버튼 */}
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleProjectDetail(project)}
                    >
                      <h3 className="font-bold text-gray-900 text-[20px] leading-[23.87px]">{project.name}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // 이벤트 버블링 방지
                        setProjectToDelete(project.id)
                        setIsDeleteModalOpen(true)
                      }}
                      className="p-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 기존 프로젝트 정보 */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleProjectDetail(project)}
                  >
                    <div className="flex align-center justify-between">
                      <div>
                        {/* 계약 기간 */}
                        <div className="flex items-center font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F]">
                          <span className="mr-2">계약 기간 :</span>
                          <span>
                            {project.start_date && project.end_date ? 
                              `${new Date(project.start_date).toLocaleDateString('ko-KR', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit'
                              }).replace(/\. /g, '.').slice(0, -1)} ~ ${
                                new Date(project.end_date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }).replace(/\. /g, '.').slice(0, -1)
                              }` 
                              : '기간 미설정'
                            }
                          </span>
                        </div>
                      </div>
                      <div 
                        className="flex flex-row gap-2 w-[50%]"
                        onClick={(e) => e.stopPropagation()}  // 이 영역의 클릭 이벤트가 상위로 전파되지 않도록 함
                      >
                        <button 
                          type="button" 
                          className="w-[49%] h-[44px] bg-[#FFFF01] rounded-[6px] font-pretendard font-semibold text-[14px] leading-[19.09px] text-black"
                          onClick={(e) => {
                            handleManpowerClick(project);
                          }}
                        >
                          실무자 공수 관리
                        </button>

                        <a 
                          href="https://eluo-sn-projects-six.vercel.app/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-[49%] h-[44px] bg-[#4E49E7] rounded-[6px] font-pretendard font-semibold text-[14px] leading-[19.09px] text-white flex items-center justify-center"
                        >
                          업무 요건 등록 및 확인
                        </a>
                      </div>
                    </div>

                    {/* 프로젝트 진행상황 섹션 */}
                    <div className="mt-8">
                      {/* 타이틀 */}
                      <h4 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mb-4">
                        {project.category}
                      </h4>

                      {/* 프로그램 진행 그래프 */}
                      <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                        {project.start_date && project.end_date && (
                          <>
                            {/* 진행률 바 */}
                            <div 
                              className="absolute top-0 left-0 h-full bg-[#FF3B9A] rounded-full"
                              style={{ 
                                width: `${calculateProgress(project.start_date, project.end_date)}%`,
                              }}
                            />
                            {/* 현재 시점 표시 마커 */}
                            <div 
                              className="absolute top-[-5px] w-4 h-4 bg-[#FF3B9A] rounded-full border-2 border-white"
                              style={{ 
                                left: `calc(${calculateProgress(project.start_date, project.end_date)}% - 8px)`,
                              }}
                            />
                          </>
                        )}
                      </div>

                      {/* 날짜 표시 */}
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {project.start_date ? 
                            new Date(project.start_date).toLocaleDateString('ko-KR', {
                              month: '2-digit',
                              day: '2-digit'
                            }).replace(/\. /g, '.')
                            : ''
                          }
                        </span>
                        <span>
                          {project.end_date ? 
                            new Date(project.end_date).toLocaleDateString('ko-KR', {
                              month: '2-digit',
                              day: '2-digit'
                            }).replace(/\. /g, '.')
                            : ''
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 테이블 뷰 */}
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Worker Type 범례 추가 */}
              <div className="px-6 py-3 flex justify-end items-center space-x-4">
                <ul className="flex items-center space-x-4">
                  <li className="flex items-center">
                    <span className="text-[13px] text-[#3DAF07]">협력사임직원</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-[13px] text-[#1D89EA]">프리랜서(기업)</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-[13px] text-[#FF00BF]">프리랜서(개인)</span>
                  </li>
                </ul>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="w-[25px]  text-left text-[13px] font-medium text-gray-500">번호</th>
                      <th className="w-[200px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">프로젝트명</th>
                      <th className="w-[40px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">구분</th>
                      <th className="w-[40px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">상태</th>
                      <th className="w-[60px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">BD(BM)</th>
                      <th className="w-[60px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">PM(PL)</th>
                      <th className="w-[200px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">기획자</th>
                      <th className="w-[200px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">디자이너</th>
                      <th className="w-[200px] px-3 py-4 text-left text-[13px] font-medium text-gray-500">퍼블리셔</th>
                      <th className="w-[150px] text-left text-[13px] font-medium text-gray-500">개발자</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map((project, index) => (
                      <tr 
                        key={project.id}
                        className="hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <td className="align-baseline">
                          <span className="text-[13px] text-gray-500">{index + 1}</span>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <button 
                            className="text-[13px] text-gray-900 hover:text-[#4E49E7] text-left font-bold"
                            onClick={() => handleProjectDetail(project)}
                          >
                            {project.name}
                          </button>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <span className="text-[13px] text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{project.category}</span>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <span className="inline-flex items-center text-[12px] font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                            {project.status || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <div className="text-[13px] text-gray-900 flex flex-col gap-1">
                            {project.manpower?.['BD(BM)']?.map((worker, i) => (
                              <button 
                                key={i} 
                                className="px-2 py-1 hover:font-bold transition-colors w-full text-left whitespace-nowrap overflow-hidden text-ellipsis"
                                style={{ color: WORKER_TYPE_COLORS[worker.worker_type as keyof typeof WORKER_TYPE_COLORS] || 'inherit' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManpowerClick(project);
                                }}
                              >
                                {worker.name}
                              </button>
                            )) || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <div className="text-[13px] text-gray-900 flex flex-col gap-1">
                            {project.manpower?.['PM(PL)']?.map((worker, i) => (
                              <button 
                                key={i} 
                                className="rounded hover:font-bold transition-colors w-full text-left whitespace-nowrap overflow-hidden text-ellipsis text-left"
                                style={{ color: WORKER_TYPE_COLORS[worker.worker_type as keyof typeof WORKER_TYPE_COLORS] || 'inherit' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManpowerClick(project);
                                }}
                              >
                                {worker.name}
                              </button>
                            )) || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <div className="text-[13px] text-gray-900 flex flex-wrap gap-1 max-w-[200px] sm:max-w-[250px] md:max-w-[300px] ">
                            {project.manpower?.['기획']?.map((worker, i) => (
                              <button 
                                key={i} 
                                className="rounded hover:font-bold transition-colors w-[calc(25%-4px)] whitespace-nowrap overflow-hidden text-ellipsis text-left"
                                style={{ color: WORKER_TYPE_COLORS[worker.worker_type as keyof typeof WORKER_TYPE_COLORS] || 'inherit' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManpowerClick(project);
                                }}
                              >
                                {worker.name}
                              </button>
                            )) || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <div className="text-[13px] text-gray-900 flex flex-wrap gap-1 max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                            {project.manpower?.['디자이너']?.map((worker, i) => (
                              <button 
                                key={i} 
                                className="rounded hover:font-bold transition-colors w-[calc(25%-4px)] whitespace-nowrap overflow-hidden text-ellipsis text-left"
                                style={{ color: WORKER_TYPE_COLORS[worker.worker_type as keyof typeof WORKER_TYPE_COLORS] || 'inherit' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManpowerClick(project);
                                }}
                              >
                                {worker.name}
                              </button>
                            )) || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-4 align-baseline">
                          <div className="text-[13px] text-gray-900 flex flex-wrap gap-1 max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                            {project.manpower?.['퍼블리셔']?.map((worker, i) => (
                              <button 
                                key={i} 
                                className="rounded hover:font-bold transition-colors w-[calc(25%-4px)] whitespace-nowrap overflow-hidden text-ellipsis text-left"
                                style={{ color: WORKER_TYPE_COLORS[worker.worker_type as keyof typeof WORKER_TYPE_COLORS] || 'inherit' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManpowerClick(project);
                                }}
                              >
                                {worker.name}
                              </button>
                            )) || '-'}
                          </div>
                        </td>
                        <td className="align-baseline">
                          <div className="text-[13px] text-gray-900 flex flex-wrap gap-1 max-w-[150px] sm:max-w-[180px] md:max-w-[200px]">
                            {project.manpower?.['개발']?.map((worker, i) => (
                              <button 
                                key={i} 
                                className="rounded hover:font-bold transition-colors w-[calc(33.33%-4px)] whitespace-nowrap overflow-hidden text-ellipsis text-left"
                                style={{ color: WORKER_TYPE_COLORS[worker.worker_type as keyof typeof WORKER_TYPE_COLORS] || 'inherit' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManpowerClick(project);
                                }}
                              >
                                {worker.name}
                              </button>
                            )) || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </nav>
          </div>
        )}

        {/* 프로젝트 추가 슬라이드오버 */}
        <AddProjectSlideOver
          isOpen={isAddSlideOverOpen}
          onClose={() => setIsAddSlideOverOpen(false)}
          onSubmit={handleProjectSubmit}
        />

        {/* 프로젝트 상세 슬라이드오버 */}
        <AddProjectSlideOver
          isOpen={isDetailSlideOverOpen}
          onClose={() => {
            setIsDetailSlideOverOpen(false)
            setSelectedProject(null)
            window.history.replaceState({}, '', window.location.pathname)
          }}
          project={selectedProject}
          mode="edit"
          onSubmit={handleProjectSubmit}
          openManpowerModal={!!selectedProject?.id && window.location.search.includes('projectId')}
        />

        {/* 삭제 확인 모달 */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={() => setIsDeleteModalOpen(false)} />
              
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">
                        프로젝트 삭제
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          정말 삭제하시겠습니까?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      if (projectToDelete) {
                        handleDeleteProject(projectToDelete)
                        setIsDeleteModalOpen(false)
                        setProjectToDelete(null)
                      }
                    }}
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => {
                      setIsDeleteModalOpen(false)
                      setProjectToDelete(null)
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 공수 관리 모달 */}
        {showManpowerModal && (
          <AddManpowerModal
            isOpen={showManpowerModal}
            onClose={() => setShowManpowerModal(false)}
            projectId={currentProjectId}
            startDate={projectDates.startDate}
            endDate={projectDates.endDate}
            selectedWorkers={selectedWorkers}
            onManpowerUpdate={(updatedWorkers) => {
              setSelectedWorkers(updatedWorkers);
            }}
          />
        )}
      </div>
    </div>
  )
} 