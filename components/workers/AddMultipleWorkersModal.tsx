'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { WorkerJobType } from '@/types/worker'
import { toast } from 'react-hot-toast'

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

  const jobTypes: WorkerJobType[] = ['기획', '디자인', '퍼블리싱', '개발']

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

  const handleNameChange = (id: string, value: string) => {
    // 한글 입력 중에는 검사하지 않음
    const nativeEvent = window.event as InputEvent
    if (nativeEvent.isComposing) {
      handleChange(id, 'name', value)
      return
    }

    // 특수문자 검사
    const nameRegex = /^[가-힣a-zA-Z0-9\s()（）[\]｛｝《》〈〉「」『』【】]*$/
    if (value && !nameRegex.test(value)) {
      toast.error('특수문자는 입력할 수 없습니다.')
      return
    }

    // 길이 검사
    if (value.length > 100) {
      toast.error('이름은 최대 100자까지 입력 가능합니다.')
      return
    }

    handleChange(id, 'name', value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. 기본 유효성 검사
    const emptyFields = workers.filter(w => !w.name)
    if (emptyFields.length > 0) {
      toast.error('모든 실무자의 이름을 입력해주세요.')
      return
    }

    // 2. 이름 길이 검사
    const longNames = workers.filter(w => w.name.length > 100)
    if (longNames.length > 0) {
      toast.error('이름은 최대 100자까지 입력 가능합니다.')
      return
    }

    // 3. 특수문자 검사
    const nameRegex = /^[가-힣a-zA-Z0-9\s()（）[\]｛｝《》〈〉「」『』【】]*$/
    const invalidNames = workers.filter(w => !nameRegex.test(w.name))
    if (invalidNames.length > 0) {
      toast.error('특수문자는 입력할 수 없습니다.')
      return
    }

    onSubmit(workers)
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">실무자 이름</label>
                      <input
                        type="text"
                        value={worker.name}
                        onChange={(e) => handleNameChange(worker.id, e.target.value)}
                        className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-[#4E49E7] focus:ring-[#4E49E7] sm:text-sm"
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">직무</label>
                      <select
                        value={worker.job_type}
                        onChange={(e) => handleChange(worker.id, 'job_type', e.target.value)}
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
                className="w-full py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#4E49E7] hover:bg-[#3F3ABE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E49E7]"
              >
                추가하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 