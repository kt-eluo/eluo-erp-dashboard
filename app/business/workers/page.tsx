'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Worker, WorkerJobType, WorkerLevelType, WorkerMMRecord } from '@/types/worker'
import AddWorkerSlideOver from '@/components/workers/AddWorkerSlideOver'
import { Search } from 'lucide-react'
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

export default function WorkersManagementPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobType, setSelectedJobType] = useState<WorkerJobType | 'all'>('all')
  const [isAddSlideOverOpen, setIsAddSlideOverOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMultipleAddModalOpen, setIsMultipleAddModalOpen] = useState(false)
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
          job_type,
          level,
          price,
          is_dispatched,
          created_at
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

      setWorkers(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('실무자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [selectedJobType, searchTerm])

  const handleAddWorker = async (data: { worker: WorkerFormData, mmRecords: WorkerMMRecord[] }) => {
    if (loading) return

    try {
      setLoading(true)
      toast.loading('실무자 추가 중...')

      // 1. 동일한 이름의 실무자들 조회 (삭제되지 않은 실무자 중에서, 생성일 오름차순)
      const { data: existingWorkers, error: searchError } = await supabase
        .from('workers')
        .select('id, name, created_at')
        .eq('name', data.worker.name)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (searchError) {
        console.error('Error searching workers:', searchError)
        toast.dismiss()
        toast.error('실무자 확인 중 오류가 발생했습니다.')
        return
      }

      let finalName = data.worker.name

      // 2. 동명이인이 있는 경우 처리
      if (existingWorkers && existingWorkers.length > 0) {
        // 기존 실무자들 이름 업데이트 (가장 오래된 순서대로 넘버링)
        for (let i = 0; i < existingWorkers.length; i++) {
          const { error: updateError } = await supabase
            .from('workers')
            .update({ name: `${data.worker.name}_${i + 1}` })
            .eq('id', existingWorkers[i].id)

          if (updateError) {
            console.error('Error updating existing worker:', updateError)
            toast.dismiss()
            toast.error('실무자 정보 업데이트 중 오류가 발생했습니다.')
            return
          }
        }

        // 새로운 실무자는 다음 번호 부여
        finalName = `${data.worker.name}_${existingWorkers.length + 1}`
      }

      // 3. 새로운 실무자 추가
      const { data: newWorker, error: insertError } = await supabase
        .from('workers')
        .insert({
          name: finalName,  // 넘버링이 붙은 이름으로 추가
          job_type: data.worker.job_type || null,
          level: data.worker.level || null,
          price: data.worker.price || null,
          is_dispatched: data.worker.is_dispatched ?? false
        })
        .select()
        .single()

      if (insertError) {
        console.error('Worker Insert Error:', insertError)
        toast.dismiss()
        toast.error('실무자 추가 중 오류가 발생했습니다.')
        return
      }

      // 4. 목록 새로고침
      await fetchWorkers()
      setIsAddSlideOverOpen(false)
      
      toast.dismiss()
      if (existingWorkers && existingWorkers.length > 0) {
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

  const handleDeleteWorker = async () => {
    if (!selectedWorker?.id) return

    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      setLoading(true)
      toast.loading('삭제 중...')

      // 추후 구현
      console.log('Deleting worker:', selectedWorker.id)
      
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

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsAddSlideOverOpen(true)
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[20px] font-semibold">실무자 관리</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsMultipleAddModalOpen(true)}
            className="px-4 py-2 text-[12px] text-black rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
          >
            여러명 추가
          </button>
          <button 
            onClick={() => setIsAddSlideOverOpen(true)}
            className="px-4 py-2 text-[12px] bg-[#4E49E7] text-white rounded-lg hover:bg-[#3F3ABE] transition-colors border border-black"
          >
            추가
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#4E49E7] focus:border-[#4E49E7] sm:text-sm"
            placeholder="실무자 검색"
          />
        </div>
      </div>

      <div className="flex items-center text-sm text-black-500 bg-gray-50 px-4 py-3 rounded-lg mb-6">
        <svg 
          className="w-5 h-5 mr-2 text-gray-400" 
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

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedJobType('all')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${selectedJobType === 'all'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${selectedJobType === jobType
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {jobType}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider">
                  직무
                </th>
                <th className="px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-[14px] font-medium text-gray-500 uppercase tracking-wider">
                  파견여부
                </th>
                <th className="px-6 py-3 text-right text-[14px] font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-[16px] font-medium text-gray-900">{worker.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {worker.job_type ? (
                      <span className="px-2 py-1 text-[14px] font-medium rounded-full bg-gray-100">
                        {worker.job_type}
                      </span>
                    ) : (
                      <span className="text-gray-400">미지정</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-[16px] text-gray-900">
                      {worker.level || <span className="text-gray-400">미지정</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-[16px] text-gray-900">
                      {worker.price 
                        ? `${new Intl.NumberFormat('ko-KR').format(worker.price)}원`
                        : <span className="text-gray-400">미지정</span>
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      worker.is_dispatched 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {worker.is_dispatched ? '파견중' : '파견안함'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-[14px] font-medium">
                    <button 
                      onClick={() => handleEditWorker(worker)}
                      className="text-[#4E49E7] hover:text-[#3F3ABE] mr-4 border-b border-[#4E49E7] hover:border-[#3F3ABE]"
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedWorker(worker);
                        handleDeleteWorker();
                      }}
                      className="text-red-600 hover:text-red-700 border-b border-red-600 hover:border-red-700"
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
    </div>
  )
} 