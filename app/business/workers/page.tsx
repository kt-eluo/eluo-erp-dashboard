'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Worker, WorkerJobType, WorkerLevelType, WorkerMMRecord } from '@/types/worker'
import AddWorkerSlideOver from '@/components/workers/AddWorkerSlideOver'
import { Search, LayoutGrid, Table } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AddMultipleWorkersModal from '@/components/workers/AddMultipleWorkersModal'

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
      let query = supabase
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
          mmRecords: worker_mm_records(mm_value)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        
      if (selectedJobType !== 'all') {
        query = query.eq('job_type', selectedJobType)
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching workers:', error)
        toast.error('실무자 목록을 불러오는데 실패했습니다.')
        return
      }

      console.log('Fetched workers:', data) // 디버깅용 로그
      setWorkers(data || [])
    } catch (error) {
      console.error('Error:', error)
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

  const handleAddWorker = async (data: { 
    type?: 'update';  // 수정 모드를 위한 타입 추가
    worker?: {
      name: string;
      worker_type: WorkerType | null;
      grade: WorkerGradeType | null;
      job_type: WorkerJobType | null;
      level: WorkerLevelType | null;
      price: number | null;
      is_dispatched: boolean | null;
    }; 
    mmRecords?: WorkerMMRecord[] 
  }) => {
    try {
      setLoading(true)

      // 수정 모드일 경우 바로 fetchWorkers 실행
      if (data.type === 'update') {
        await fetchWorkers()
        return
      }
      
      // 새로운 실무자 추가 로직 (기존 코드)
      const workerData = {
        name: data.worker!.name,
        worker_type: data.worker!.worker_type,
        grade: data.worker!.grade,
        job_type: data.worker!.job_type,
        level: data.worker!.level,
        price: data.worker!.price,
        is_dispatched: data.worker!.is_dispatched
      }
      
      console.log('Formatted worker data:', workerData)

      const { data: insertedData, error: workerError } = await supabase
        .from('workers')
        .insert([workerData])
        .select()
        .single()

      if (workerError) {
        console.error('Supabase error details:', workerError)
        toast.error(`실무자 추가 실패: ${workerError.message}`)
        return
      }

      if (!insertedData) {
        console.error('No data returned after insert')
        toast.error('실무자 데이터 추가 실패')
        return
      }

      console.log('Successfully inserted worker:', insertedData)
      toast.success('실무자가 추가되었습니다.')
      setIsAddSlideOverOpen(false)
      fetchWorkers()

    } catch (error) {
      console.error('Detailed error:', error)
      toast.error('실무자 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorker = async (worker?: Worker) => {
    if (!worker?.id) return

    try {
      setLoading(true)
      toast.loading('삭제 중...')

      // 1. 삭제할 실무자의 이름이 넘버링된 이름인지 확인
      const nameMatch = worker.name.match(/^(.+)_(\d+)$/)
      if (nameMatch) {
        const baseName = nameMatch[1]  // 기본 이름
        
        // 2. 동일한 기본 이름을 가진 다른 실무자들 조회
        const { data: sameNameWorkers, error: searchError } = await supabase
          .from('workers')
          .select('id, name, created_at')
          .like('name', `${baseName}_%`)
          .is('deleted_at', null)
          .neq('id', worker.id)  // 삭제할 실무자 제외
          .order('created_at', { ascending: true })

        if (searchError) {
          console.error('Error searching workers:', searchError)
          toast.dismiss()
          toast.error('실무자 조회 중 오류가 발생했습니다.')
          return
        }

        // 3. 남은 실무자들의 넘버링 재정렬
        if (sameNameWorkers && sameNameWorkers.length > 0) {
          for (let i = 0; i < sameNameWorkers.length; i++) {
            const { error: updateError } = await supabase
              .from('workers')
              .update({ name: `${baseName}_${i + 1}` })
              .eq('id', sameNameWorkers[i].id)

            if (updateError) {
              console.error('Error updating worker name:', updateError)
              toast.dismiss()
              toast.error('실무자 이름 업데이트 중 오류가 발생했습니다.')
              return
            }
          }
        }
      }

      try {
        // 2. M/M 기록 삭제 시도
        const { error: mmDeleteError } = await supabase
          .from('worker_mm_records')
          .delete()
          .eq('worker_id', worker.id)

        if (mmDeleteError) {
          // 로그만 남기고 진행 (차단하지 않음)
          console.warn('Warning: M/M records deletion skipped:', mmDeleteError)
        }
      } catch (mmError) {
        // 로그만 남기고 진행
        console.warn('Warning: Error with M/M records:', mmError)
      }

      // 3. 실무자 삭제
      const { error: deleteError } = await supabase
        .from('workers')
        .delete()
        .eq('id', worker.id)

      if (deleteError) {
        console.error('Error deleting worker:', deleteError)
        toast.dismiss()
        toast.error('실무자 삭제 중 오류가 발생했습니다.')
        return
      }

      // 4. 목록 새로고침 및 UI 정리
      await fetchWorkers()
      setSelectedWorker(null)
      if (isAddSlideOverOpen) {
        setIsAddSlideOverOpen(false)
      }
      
      toast.dismiss()
      toast.success('실무자가 삭제되었습니다.')
    } catch (error) {
      console.error('Error:', error)
      toast.dismiss()
      toast.error('삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditWorker = async (worker: Worker) => {
    try {
      // 1. 현재 수정하려는 실무자의 이름이 다른 실무자와 중복되는지 확인
      const { data: existingWorkers, error: searchError } = await supabase
        .from('workers')
        .select('name')
        .eq('name', worker.name)
        .neq('id', worker.id)  // 현재 실무자는 제외
        .is('deleted_at', null)

      if (searchError) {
        console.error('Error checking existing workers:', searchError)
        toast.error('실무자 조회에 실패했습니다.')
        return
      }

      // 2. 동명이인이 있는 경우 넘버링 추가
      let finalName = worker.name
      if (existingWorkers && existingWorkers.length > 0) {
        finalName = `${worker.name}_${existingWorkers.length + 1}`
        worker.name = finalName
      }

      // 3. 최신 데이터 조회
      const { data: freshWorker, error } = await supabase
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
          created_at
        `)
        .eq('id', worker.id)
        .single()

      if (error) {
        console.error('Error fetching worker:', error)
        return
      }

      // 4. 수정을 위해 선택된 실무자 설정
      setSelectedWorker(freshWorker)
      setIsAddSlideOverOpen(true)

    } catch (error) {
      console.error('Error editing worker:', error)
      toast.error('실무자 수정 중 오류가 발생했습니다.')
    }
  }

  const handleAddMultipleWorkers = async (workers: WorkerInput[]) => {
    if (loading) return

    try {
      setLoading(true)
      toast.loading('실무자 추가 중...')

      let hasNameConflict = false  // 동명이인 발생 여부 체크

      // 각 실무자별로 처리
      for (const workerInput of workers) {
        // 1. 동일한 이름의 실무자들 조회 (기본 이름 + 넘버링된 이름 모두 검색)
        const { data: existingWorkers, error: searchError } = await supabase
          .from('workers')
          .select('id, name, created_at')
          .or(`name.eq.${workerInput.name},name.like.${workerInput.name}_%`)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })

        if (searchError) {
          console.error('Error searching workers:', searchError)
          toast.dismiss()
          toast.error('실무자 확인 중 오류가 발생했습니다.')
          return
        }

        let finalName = workerInput.name

        // 2. 동명이인이 있는 경우 처리
        if (existingWorkers && existingWorkers.length > 0) {
          hasNameConflict = true  // 동명이인 발생 표시
          // 2-1. 현재 사용 중인 가장 큰 넘버링 찾기
          let maxNumber = 0
          existingWorkers.forEach(worker => {
            const match = worker.name.match(new RegExp(`${workerInput.name}_(\\d+)$`))
            if (match) {
              const num = parseInt(match[1])
              maxNumber = Math.max(maxNumber, num)
            }
          })

          // 2-2. 기존 넘버링이 없는 이름이 있다면 먼저 처리
          const originalName = existingWorkers.find(w => w.name === workerInput.name)
          if (originalName) {
            const { error: updateError } = await supabase
              .from('workers')
              .update({ name: `${workerInput.name}_1` })
              .eq('id', originalName.id)

            if (updateError) {
              console.error('Error updating existing worker:', updateError)
              toast.dismiss()
              toast.error('실무자 정보 업데이트 중 오류가 발생했습니다.')
              return
            }
            maxNumber = Math.max(maxNumber, 1)
          }

          // 2-3. 새로운 실무자는 다음 번호 부여
          finalName = `${workerInput.name}_${maxNumber + 1}`
        }

        // 3. 새로운 실무자 추가
        const { error: insertError } = await supabase
          .from('workers')
          .insert({
            name: finalName,
            job_type: workerInput.job_type || null,
            is_dispatched: false
          })

        if (insertError) {
          console.error('Worker Insert Error:', insertError)
          toast.dismiss()
          toast.error(`${workerInput.name} 추가 중 오류가 발생했습니다.`)
          return
        }
      }

      await fetchWorkers()
      setIsMultipleAddModalOpen(false)
      
      toast.dismiss()
      if (hasNameConflict) {
        toast.success('실무자 추가가 완료되었습니다. 동명이인이 있어 자동으로 넘버가 추가됩니다.')
      } else {
        toast.success('실무자 추가가 완료되었습니다.')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.dismiss()
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

  const handleDeleteClick = (worker: Worker) => {
    setWorkerToDelete(worker)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return
    
    await handleDeleteWorker(workerToDelete)
    setIsDeleteModalOpen(false)
    setWorkerToDelete(null)
  }

  // 현재 페이지의 데이터만 가져오는 함수
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return workers.filter(worker => {
      if (selectedJobType === 'all') return true
      return worker.job_type === selectedJobType
    }).slice(startIndex, endIndex)
  }

  // totalPages 계산 로직 수정
  const filteredWorkers = workers.filter(worker => {
    if (selectedJobType === 'all') return true
    return worker.job_type === selectedJobType
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
            onClick={() => setIsAddSlideOverOpen(true)}
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
          className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
                        <span className="text-[14px] text-gray-900">{worker.worker_type || '미지정'}</span>
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
                          onClick={() => handleEditWorker(worker)}
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
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
                    {worker.job_type && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${getJobTypeTagStyles(worker.job_type)}`}>
                        {worker.job_type}
                      </span>
                    )}
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
                      <span className="w-16">직원여부</span>
                      <span className="text-gray-900">{worker.worker_type || '-'}</span>
                    </div>
                    <div className="flex items-center text-[13px] text-gray-500">
                      <span className="w-16">파견여부</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        worker.is_dispatched 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        {worker.is_dispatched ? '파견중' : '파견안함'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditWorker(worker)}
                      className="flex-1 py-1.5 text-[12px] font-medium text-[#4E49E7] hover:bg-[#4E49E7]/5 rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(worker)}
                      className="flex-1 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
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
        onClose={() => {
          setIsAddSlideOverOpen(false)
          setSelectedWorker(null)
        }}
        onSubmit={handleAddWorker}
        onDelete={handleDeleteWorker}
        isEdit={!!selectedWorker}
        workerId={selectedWorker?.id}
        worker={selectedWorker}
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
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      실무자 삭제
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {workerToDelete?.name}님을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="inline-flex w-full justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  삭제
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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