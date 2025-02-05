'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Worker, WorkerJobType, WorkerLevelType } from '@/types/worker'
import AddWorkerSlideOver from '@/components/workers/AddWorkerSlideOver'

interface WorkerFormData {
  name: string;
  job_type: WorkerJobType;
  level: WorkerLevelType;
  price: number;
  is_dispatched: boolean | null;
}

export default function WorkersManagementPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobType, setSelectedJobType] = useState<WorkerJobType | 'all'>('all')
  const [isAddSlideOverOpen, setIsAddSlideOverOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발']

  const fetchWorkers = async () => {
    try {
      let query = supabase
        .from('workers')
        .select('*')
        
      if (selectedJobType !== 'all') {
        query = query.eq('job_type', selectedJobType)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setWorkers(data || [])
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [selectedJobType])

  const handleAddWorker = async (data: WorkerFormData) => {
    try {
      const { error } = await supabase
        .from('workers')
        .insert([data])

      if (error) throw error

      // 성공적으로 추가되면 목록 새로고침
      fetchWorkers()
      setIsAddSlideOverOpen(false)
    } catch (error) {
      console.error('Error adding worker:', error)
    }
  }

  const handleDeleteWorker = async () => {
    if (!selectedWorker?.id) return

    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', selectedWorker.id)

      if (error) throw error

      // 성공적으로 삭제되면 목록 새로고침
      fetchWorkers()
      setIsAddSlideOverOpen(false)
      setSelectedWorker(null)
    } catch (error) {
      console.error('Error deleting worker:', error)
    }
  }

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsAddSlideOverOpen(true)
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
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="프로젝트 또는 실무자 이름을 검색해세요."
              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-gray-30 border-gray-300 focus:outline-none focus:border-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 text-black rounded-lg hover:bg-gray-50 transition-colors border border-gray-300">
              여러명 추가
            </button>
            <button 
              onClick={() => setIsAddSlideOverOpen(true)}
              className="px-4 py-2 bg-[#4E49E7] text-white rounded-lg hover:bg-[#3F3ABE] transition-colors border border-black"
            >
              추가
            </button>
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
          각 직무 별 이름은 가나다순으로 정렬돼요.
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
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직무
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파견여부
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.job_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Intl.NumberFormat('ko-KR').format(worker.price)}원
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      worker.is_dispatched 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {worker.is_dispatched ? '파견중' : '대기중'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      />
    </div>
  )
} 