'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Worker, WorkerJobType, WorkerLevelType, WorkerMMRecord } from '@/types/worker'
import AddWorkerSlideOver from '@/components/workers/AddWorkerSlideOver'
import { Search, LayoutGrid, Table } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AddMultipleWorkersModal from '@/components/workers/AddMultipleWorkersModal'

interface Worker {
  id: string;
  name: string;
  job_type: string;
  worker_type: string | null;
  grade?: string;
  level?: string;
  price: number | null;
  is_dispatched: boolean;
  created_at: string;
  monthly_effort?: number;
  project_manpower?: Array<{
    id: string;
    project_monthly_efforts?: Array<{
      mm_value: number;
      year: number;
      month: number;
    }>;
  }>;
}

interface WorkerFormData {
  name: string;
  job_type: WorkerJobType | null;
  level: WorkerLevelType | null;
  price: number | null;
  is_dispatched: boolean;
}

interface WorkerInput {
  id: string;
  name: string;
  job_type: WorkerJobType | '';
}

const ITEMS_PER_PAGE = 20  // 한 페이지당 표시할 항목 수

export default function WorkersManagementPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobType, setSelectedJobType] = useState<WorkerJobType | 'all'>('all')
  const [isAddSlideOverOpen, setIsAddSlideOverOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isMultipleAddModalOpen, setIsMultipleAddModalOpen] = useState(false)
  const [viewType, setViewType] = useState<'table' | 'card'>('card')
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발']

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1

      let { data: workersData, error } = await supabase
        .from('workers')
        .select(`
          id,
          name,
          worker_type,
          grade,
          job_type,
          level,
          price,
          is_dispatched,
          created_at,
          project_manpower:project_manpower(
            id,
            project_monthly_efforts!project_monthly_efforts_project_manpower_id_fkey(
              mm_value,
              year,
              month
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 현재 월의 공수 계산
      const workersWithMonthlyEffort = workersData?.map(worker => {
        const monthlyEffort = worker.project_manpower?.reduce((total, pm) => {
          const currentMonthEfforts = pm.project_monthly_efforts
            ?.filter(effort => effort.year === currentYear && effort.month === currentMonth)
            ?.reduce((sum, effort) => {
              const mmValue = effort.mm_value || 0;
              return sum + mmValue;
            }, 0) || 0;
          return total + currentMonthEfforts;
        }, 0) || 0;

        return {
          ...worker,
          monthly_effort: monthlyEffort
        }
      });

      setWorkers(workersWithMonthlyEffort || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
      toast.error('실무자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchWorkers()
  }, [selectedJobType, searchTerm])

  const handleWorkerSubmit = async (data: { type: string; worker: any }) => {
    try {
      setLoading(true)

      // 수정 모드일 때
      if (data.type === 'update') {
        const { error: updateError } = await supabase
          .from('workers')
          .update({
            name: data.worker.name,
            worker_type: data.worker.worker_type,
            grade: data.worker.grade,
            job_type: data.worker.job_type,
            level: data.worker.level,
            price: data.worker.price,
            is_dispatched: data.worker.is_dispatched,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.worker.id)

        if (updateError) {
          console.error('Error updating worker:', updateError)
          toast.error('실무자 수정에 실패했습니다.')
          return
        }

        toast.success('실무자 정보가 수정되었습니다.')
      } 
      // 추가 모드일 때
      else if (data.type === 'create') {
        const { error: insertError } = await supabase
          .from('workers')
          .insert({
            name: data.worker.name,
            worker_type: data.worker.worker_type,
            grade: data.worker.grade,
            job_type: data.worker.job_type,
            level: data.worker.level,
            price: data.worker.price,
            is_dispatched: data.worker.is_dispatched,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting worker:', insertError)
          toast.error('실무자 추가에 실패했습니다.')
          return
        }

        toast.success('실무자가 추가되었습니다.')
      }

      setIsAddSlideOverOpen(false)
      fetchWorkers()

    } catch (error) {
      console.error('Error:', error)
      toast.error('작업 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorker = async (worker: Worker | undefined) => {
    if (!worker?.id) {
      console.error('Worker ID is missing')
      return
    }
    
    try {
      setLoading(true)
      toast.loading('삭제 중...')

      console.log('Deleting worker:', worker.id) // 디버깅용

      // M/M 기록 삭제
      const { error: mmError } = await supabase
        .from('worker_mm_records')
        .delete()
        .eq('worker_id', worker.id)

      if (mmError) {
        console.error('Error deleting MM records:', mmError)
        toast.error('M/M 기록 삭제 중 오류가 발생했습니다.')
        return
      }

      // 실무자 소프트 삭제
      const { error: deleteError } = await supabase
        .from('workers')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', worker.id)

      if (deleteError) {
        console.error('Error deleting worker:', deleteError)
        toast.error('실무자 삭제 중 오류가 발생했습니다.')
        return
      }

      toast.success('실무자가 삭제되었습니다.')
      fetchWorkers()
      setIsDeleteModalOpen(false)
      setWorkerToDelete(null)

    } catch (error) {
      console.error('Error:', error)
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      toast.dismiss()
    }
  }

  // 수정 버튼 클릭 시 호출되는 함수 (SlideOver를 여는 함수)
  const handleEditClick = (worker: Worker) => {
    // 먼저 worker 설정
    setSelectedWorker(worker)
    // 그 다음 슬라이드 오픈
    setIsAddSlideOverOpen(true)
  }

  // 추가 버튼 클릭 시 호출되는 함수
  const handleAddClick = () => {
    // 먼저 worker 초기화
    setSelectedWorker(null)
    // 그 다음 슬라이드 오픈
    setIsAddSlideOverOpen(true)
  }

  // SlideOver 닫기 함수
  const handleSlideOverClose = () => {
    // 먼저 슬라이드 닫기
    setIsAddSlideOverOpen(false)
    // 약간의 지연 후 worker 초기화
    setTimeout(() => {
      setSelectedWorker(null)
    }, 300) // 슬라이드 애니메이션 시간과 동일하게 설정
  }

  // SlideOver에서 실제 수정 처리하는 함수
  const handleEditWorker = async (data: { type: string, worker: Worker }) => {
    try {
      // 수정일 때만 처리
      if (data.type !== 'update') return

      const { error } = await supabase
        .from('workers')
        .update({
          name: data.worker.name,
          worker_type: data.worker.worker_type,
          grade: data.worker.grade,
          job_type: data.worker.job_type,
          level: data.worker.level,
          price: data.worker.price,
          is_dispatched: data.worker.is_dispatched,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.worker.id)

      if (error) {
        console.error('Error updating worker:', error)
        toast.error('실무자 수정에 실패했습니다.')
        return
      }

      toast.success('실무자 정보가 수정되었습니다.')
      fetchWorkers()
    } catch (error) {
      console.error('Error:', error)
      toast.error('실무자 수정 중 오류가 발생했습니다.')
    }
  }

  const handleAddMultipleWorkers = async (workers: WorkerInput[]) => {
    try {
      setLoading(true)

      for (const worker of workers) {
        const { error } = await supabase
          .from('workers')
          .insert({
            name: worker.name.trim(),
            job_type: worker.job_type || null,
            worker_type: null,
            grade: null,
            level: null,
            price: null,
            is_dispatched: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error adding worker:', error)
          toast.error(`${worker.name} 추가 중 오류가 발생했습니다.`)
        }
      }

      // 모든 작업이 완료된 후
      setIsMultipleAddModalOpen(false)
      await fetchWorkers() // 목록 새로고침
      toast.success('실무자가 추가되었습니다.')

    } catch (error) {
      console.error('Error:', error)
      toast.error('실무자 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getJobTypeStyles = (jobType: WorkerJobType) => {
    switch (jobType) {
      case '기획':
        return 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
      case '디자인':
        return 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
      case '퍼블리싱':
        return 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
      case '개발':
        return 'bg-green-500 text-white shadow-md shadow-green-500/20'
      default:
        return 'bg-[#4E49E7] text-white shadow-md shadow-[#4E49E7]/20'
    }
  }

  const getJobTypeTagStyles = (jobType: WorkerJobType) => {
    switch (jobType) {
      case '기획':
        return 'bg-blue-50 text-blue-700'
      case '디자인':
        return 'bg-purple-50 text-purple-700'
      case '퍼블리싱':
        return 'bg-pink-50 text-pink-700'
      case '개발':
        return 'bg-green-50 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getWorkerTypeTagStyles = (workerType: string) => {
    switch (workerType) {
      case '정규직':
        return 'bg-blue-50 text-blue-700';
      case '계약직':
        return 'bg-orange-50 text-orange-700';
      case '프리랜서':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const handleDeleteClick = (worker: Worker) => {
    setWorkerToDelete(worker)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!workerToDelete?.id) {
      console.error('No worker to delete')
      return
    }
    
    try {
      setLoading(true)
      toast.loading('삭제 중...')

      // 실무자 삭제 (하드 삭제)
      const { error: deleteError } = await supabase
        .from('workers')
        .delete()  // update 대신 delete 사용
        .eq('id', workerToDelete.id)

      if (deleteError) {
        console.error('Error deleting worker:', deleteError)
        toast.error('실무자 삭제 중 오류가 발생했습니다.')
        return
      }

      toast.success('실무자가 삭제되었습니다.')
      setIsDeleteModalOpen(false)
      setWorkerToDelete(null)
      await fetchWorkers()

    } catch (error) {
      console.error('Error:', error)
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      toast.dismiss()
    }
  }

  // 현재 페이지의 데이터만 가져오는 함수
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return workers.filter(worker => {
      // 직무 타입 필터링
      const jobTypeMatch = selectedJobType === 'all' || worker.job_type === selectedJobType
      
      // 검색어 필터링 (이름 기준)
      const searchMatch = !searchTerm || 
        worker.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      return jobTypeMatch && searchMatch
    }).slice(startIndex, endIndex)
  }

  // totalPages 계산 로직 수정
  const filteredWorkers = workers.filter(worker => {
    const jobTypeMatch = selectedJobType === 'all' || worker.job_type === selectedJobType
    const searchMatch = !searchTerm || 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return jobTypeMatch && searchMatch
  })
  const totalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE)

  // 필터나 검색이 변경될 때 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedJobType, searchTerm])

  // 로딩 스피너
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 border-t-[#4E49E7] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-white min-h-screen">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
        <h1 className="text-[18px] sm:text-[20px] font-semibold">실무자 관리</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsMultipleAddModalOpen(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[12px] text-black rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
          >
            여러명 추가
          </button>
          <button 
            type="button"
            onClick={handleAddClick}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[12px] bg-[#4E49E7] text-white rounded-lg hover:bg-[#3F3ABE] transition-colors border border-black"
          >
            추가
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
              placeholder="실무자 검색"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-[13px] text-black bg-white hover:text-white border border-gray-400 rounded-r-md hover:bg-[#4E49E7] transition-colors duration-200"
          >
            검색
          </button>
        </form>

        <button 
          onClick={() => setViewType(viewType === 'table' ? 'card' : 'table')}
          className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {viewType === 'table' ? (
            <>
              <LayoutGrid className="w-4 h-4" />
              카드 형식
            </>
          ) : (
            <>
              <Table className="w-4 h-4" />
              테이블 형식
            </>
          )}
        </button>
      </div>

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
          각 직무 별 이름은 등록일순으로 정렬돼요.
        </div>
      </div>

      <div className="mb-8">
        <nav className="flex space-x-2">
          <button
            onClick={() => setSelectedJobType('all')}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${selectedJobType === 'all'
                ? 'bg-[#4E49E7] text-white shadow-sm shadow-[#4E49E7]/20'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            전체
          </button>
          {jobTypes.map((jobType) => (
            <button
              key={jobType}
              onClick={() => setSelectedJobType(jobType)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${selectedJobType === jobType
                  ? getJobTypeStyles(jobType)
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {jobType}
            </button>
          ))}
        </nav>
      </div>

      {viewType === 'table' ? (
        <div>
          {/* 단일 테이블 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="w-[60px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">번호</th>
                    <th className="w-[200px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">이름</th>
                    <th className="w-[100px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">직무등급</th>
                    <th className="w-[120px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">직무</th>
                    <th className="w-[100px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">기술등급</th>
                    <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">단가</th>
                    <th className="w-[120px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">직원여부</th>
                    <th className="w-[120px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">파견여부</th>
                    <th className="w-[150px] px-6 py-4 text-right text-[13px] font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getCurrentPageData().map((worker, index) => (
                    <tr 
                      key={worker.id}
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-gray-500">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-gray-900">{worker.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-gray-900">{worker.grade || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-gray-900">{worker.job_type || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-gray-900">{worker.level || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-gray-900">
                          {worker.price 
                            ? `${new Intl.NumberFormat('ko-KR').format(worker.price)}원`
                            : '미지정'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          {/* <span className="text-[14px] text-gray-900">{worker.worker_type || '미지정'}</span> */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${getWorkerTypeTagStyles(worker.worker_type)}`}>
                            {worker.worker_type || '미지정'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          worker.is_dispatched 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {worker.is_dispatched ? '파견중' : '파견안함'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleEditClick(worker)}
                          className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-[#4E49E7] hover:bg-[#4E49E7]/5 rounded-lg transition-colors"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(worker)}
                          className="inline-flex items-center px-3 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {getCurrentPageData().map((worker) => (
              <div 
                key={worker.id}
                className={`rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 ${
                  !worker.monthly_effort || worker.monthly_effort === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="pt-4 pb-3 pr-2 pl-6 space-y-4 cursor-pointer" onClick={() => handleEditClick(worker)}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{worker.name}</h3>
                    <div className="flex gap-2">
                      {worker.job_type && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${getJobTypeTagStyles(worker.job_type)}`}>
                          {worker.job_type}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${getWorkerTypeTagStyles(worker.worker_type)}`}>
                        {worker.worker_type || '미지정'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-[13px] text-gray-500">
                      <span className="w-16">직무등급</span>
                      <span className="text-gray-900">{worker.grade || '-'}</span>
                    </div>
                    <div className="flex items-center text-[13px] text-gray-500">
                      <span className="w-16">직무</span>
                      <span className="text-gray-900">{worker.job_type || '-'}</span>
                    </div>
                    <div className="flex items-center text-[13px] text-gray-500">
                      <span className="w-16">기술등급</span>
                      <span className="text-gray-900">{worker.level || '-'}</span>
                    </div>
                    <div className="flex items-center text-[13px] text-gray-500">
                      <span className="w-16">단가</span>
                      <span className="text-gray-900">{worker.price ? `${worker.price.toLocaleString()}원` : '-'}</span>
                    </div>
                    <div className="flex items-center text-[13px] text-gray-500">
                      <span className="w-16">파견여부</span>
                      <span className="text-gray-900">{worker.is_dispatched ? '파견중' : '파견안함'}</span>
                    </div>

                    {/* 현재 월 공수 표시 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-baseline gap-1 justify-center">
                        <span className={`text-xl font-bold ${
                          !worker.project_manpower?.some(pm => 
                            pm.project_monthly_efforts?.some(me => 
                              me.year === new Date().getFullYear() && 
                              me.month === new Date().getMonth() + 1 && 
                              me.mm_value > 0
                            )
                          )
                            ? 'text-red-500' 
                            : 'text-gray-900'
                        }`}>
                          {(() => {
                            const currentYear = new Date().getFullYear();
                            const currentMonth = new Date().getMonth() + 1;
                            const monthlyEffort = worker.project_manpower?.reduce((total, pm) => {
                              const monthEffort = pm.project_monthly_efforts?.reduce((sum, me) => {
                                if (me.year === currentYear && me.month === currentMonth) {
                                  return sum + (me.mm_value || 0);
                                }
                                return sum;
                              }, 0) || 0;
                              return total + monthEffort;
                            }, 0) || 0;
                            
                            return monthlyEffort === 0 
                              ? '0' 
                              : Number(monthlyEffort.toFixed(3)).toString().replace(/\.?0+$/, '');
                          })()}
                        </span>
                        <span className="text-[13px] text-gray-500">MM</span>
                      </div>
                    </div>


                    
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 - 카드 뷰에도 동일하게 적용 */}
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
        </div>
      )}

      <AddWorkerSlideOver
        isOpen={isAddSlideOverOpen}
        onClose={handleSlideOverClose}
        onSubmit={handleWorkerSubmit}
        onDelete={handleDeleteWorker}
        isEdit={!!selectedWorker}
        worker={selectedWorker}
        workerId={selectedWorker?.id}
      />

      <AddMultipleWorkersModal
        isOpen={isMultipleAddModalOpen}
        onClose={() => setIsMultipleAddModalOpen(false)}
        onSubmit={handleAddMultipleWorkers}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={() => setIsDeleteModalOpen(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      실무자 삭제
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
                  onClick={handleDeleteConfirm}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  삭제
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 inline-flex w-full -center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 