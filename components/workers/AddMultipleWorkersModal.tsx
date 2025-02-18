'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { 
  Worker, 
  WorkerJobType, 
  WorkerLevelType, 
  WorkerType, 
  WorkerGrade 
} from '@/types/worker'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface WorkerInput {
  id: string;
  name: string;
  job_type: WorkerJobType | '';
}

interface AddMultipleWorkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workers: WorkerInput[]) => void;
}

export default function AddMultipleWorkersModal({
  isOpen,
  onClose,
  onSubmit
}: AddMultipleWorkersModalProps) {
  const [workers, setWorkers] = useState<WorkerInput[]>([
    { id: '1', name: '', job_type: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [duplicateLabels, setDuplicateLabels] = useState<{ [key: string]: boolean }>({})

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발', '기타']

  const handleAddWorker = () => {
    setWorkers([
      ...workers,
      { id: String(workers.length + 1), name: '', job_type: '' }
    ])
  }

  const handleRemoveWorker = (id: string) => {
    if (workers.length === 1) return
    setWorkers(workers.filter(worker => worker.id !== id))
  }

  const handleChange = (id: string, field: keyof WorkerInput, value: string) => {
    setWorkers(workers.map(worker => 
      worker.id === id ? { ...worker, [field]: value } : worker
    ))
  }

  const handleNameChange = async (id: string, value: string) => {
    handleChange(id, 'name', value)
    
    if (!value.trim()) {
      // 이름이 비어있으면 중복 라벨 제거
      setDuplicateLabels(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
      return
    }

    // 현재 입력된 이름이 기존 실무자 목록에 있는지 체크
    const { data: existingWorkers } = await supabase
      .from('workers')
      .select('name')
      .eq('name', value)
      .is('deleted_at', null)

    // 현재 입력 폼에서 동일한 이름이 있는지 체크
    const duplicateInForm = workers.some(w => 
      w.id !== id && w.name === value
    )

    setDuplicateLabels(prev => ({
      ...prev,
      [id]: (existingWorkers && existingWorkers.length > 0) || duplicateInForm
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return

    // 1. 기본 유효성 검사 - 빈 이름 체크
    const emptyFields = workers.filter(w => !w.name.trim())
    if (emptyFields.length > 0) {
      toast.error('모든 실무자의 이름을 입력해주세요.')
      return
    }

    // 2. 중복된 이름이 있는지 확인
    const hasDuplicates = Object.values(duplicateLabels).some(isDuplicate => isDuplicate)
    if (hasDuplicates) {
      toast.error('중복된 이름이 있습니다. 구분할 수 있는 정보를 추가해주세요.')
      return
    }

    try {
      setLoading(true)
      
      // 부모 컴포넌트의 handleAddMultipleWorkers 호출
      await onSubmit(workers)
      onClose()

    } catch (error) {
      console.error('Error:', error)
      toast.error('실무자 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-xl max-w-2xl w-full overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">실무자 한 번에 추가하기</h2>
              <p className="text-sm text-gray-500 mt-1">여러 명의 실무자 리스트를 한 번에 추가해요.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 본문 */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {workers.map((worker, index) => (
                <div key={worker.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실무자 이름
                        {duplicateLabels[worker.id] && (
                          <span className="ml-2 text-xs text-red-500 font-normal">[중복]</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={worker.name}
                        onChange={(e) => handleNameChange(worker.id, e.target.value)}
                        className={`block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-[#4E49E7] focus:ring-[#4E49E7] sm:text-sm ${
                          duplicateLabels[worker.id] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder="이름을 입력하세요"
                      />
                      {duplicateLabels[worker.id] && (
                        <p className="mt-1 text-xs text-red-500">
                          이미 존재하는 이름입니다. 구분할 수 있는 정보를 추가해주세요.
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">직무</label>
                      <select
                        value={worker.job_type}
                        onChange={(e) => handleChange(worker.id, 'job_type', e.target.value as WorkerJobType)}
                        className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-[#4E49E7] focus:ring-[#4E49E7] sm:text-sm"
                      >
                        <option value="">선택해주세요</option>
                        {jobTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorker(worker.id)}
                    className="text-gray-400 hover:text-gray-500 mt-6"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddWorker}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + 실무자 추가
              </button>
            </div>

            {/* 하단 버튼 */}
            <div className="px-4 py-3 bg-gray-50 sm:px-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#4E49E7] hover:bg-[#3F3ABE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E49E7]"
              >
                {loading ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 