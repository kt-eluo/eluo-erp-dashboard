import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

type Grade = '미지정' | '특급' | '고급' | '중급' | '초급'
type Position = '부장' | '차장' | '과장' | '대리' | '주임' | '사원'
type Role = '기획' | '디자인' | '퍼블리싱' | '개발'

interface ManpowerEntry {
  role: Role
  grade: Grade
  position: Position
  unitPrice: number
  monthlyEffort: { [key: string]: number | null }  // 월별 공수
  totalEffort: number  // 투입소계
  totalCost: number    // 투입비용
}

interface AddManpowerModalProps {
  isOpen: boolean
  onClose: () => void
  startDate: Date | null
  endDate: Date | null
  selectedWorkers: {
    [key: string]: Array<{id: string, name: string}>
  }
}

export default function AddManpowerModal({ 
  isOpen, 
  onClose, 
  startDate, 
  endDate,
  selectedWorkers 
}: AddManpowerModalProps) {
  // 초기 탭을 실무자가 있는 첫 번째 직무로 설정
  const [selectedTab, setSelectedTab] = useState<Role>(() => {
    const firstRoleWithWorkers = Object.entries(selectedWorkers || {})
      .find(([_, workers]) => workers.length > 0)?.[0] as Role
    return firstRoleWithWorkers || '기획'
  })
  
  // 각 실무자별 공수 정보를 저장하는 state
  const [workersEffort, setWorkersEffort] = useState<{
    [workerId: string]: {
      grade: Grade
      position: Position
      unitPrice: number | null
      monthlyEfforts: { [month: string]: number | null }
    }
  }>({})

  const grades: Grade[] = ['미지정', '특급', '고급', '중급', '초급']
  const positions: Position[] = ['부장', '차장', '과장', '대리', '주임', '사원']
  const roles: Role[] = ['기획', '디자인', '퍼블리싱', '개발']

  // 월 목록 생성
  const getMonths = () => {
    if (!startDate || !endDate) return []
    const months: string[] = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      months.push(currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }))
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    return months
  }

  // 투입소계 계산 함수
  const calculateTotalEffort = (role: string) => {
    const efforts = workersEffort[role]?.monthlyEfforts || {}
    return Object.values(efforts).reduce((sum: number, value) => {
      return sum + (value || 0)
    }, 0)
  }

  // 실무자별 공수 입력 핸들러
  const handleWorkerEffortChange = (workerId: string, month: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setWorkersEffort(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        monthlyEfforts: {
          ...(prev[workerId]?.monthlyEfforts || {}),
          [month]: numValue
        }
      }
    }))
  }

  // 투입비용 계산 함수
  const calculateTotalCost = (role: string) => {
    const effort = calculateTotalEffort(role)
    const unitPrice = workersEffort[role]?.unitPrice
    
    if (!unitPrice) return 0
    return effort * unitPrice
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999]">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/25" 
        onClick={onClose} 
      />
      
      {/* 모달 컨테이너 */}
      <div className="relative bg-white rounded-lg p-6 w-[700px] max-h-[90vh] overflow-y-auto z-10">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-20">
          <h2 className="text-lg font-semibold">공수 관리</h2>
          <div className="flex items-center gap-2">
            {/* 저장 버튼 */}
            <button
              type="button"
              className="px-4 h-[32px] bg-[#4E49E7] text-white rounded-[6px] text-sm font-medium hover:bg-[#3F3ABE] transition-colors"
            >
              저장
            </button>
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6 sticky top-[60px] bg-white z-20">
          <nav className="flex space-x-8">
            {Object.entries(selectedWorkers || {}).map(([role, workers]) => (
              workers.length > 0 && (
                <button
                  key={role}
                  onClick={() => setSelectedTab(role as Role)}
                  className={`py-2 px-1 text-sm font-medium border-b-2 relative ${
                    selectedTab === role
                      ? 'border-[#4E49E7] text-[#4E49E7]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {role} ({workers.length})
                </button>
              )
            ))}
          </nav>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="relative z-10">
          {selectedTab && selectedWorkers[selectedTab]?.map((worker, index) => (
            <div 
              key={worker.id}
              className="p-6 rounded-lg border border-gray-200 bg-white mb-4 hover:border-gray-300 transition-all"
            >
              {/* 실무자 정보 섹션 */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-medium text-gray-900">{worker.name}</span>
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded-full">{worker.job_type}</span>
                </div>
              </div>

              {/* 등급/직급/단가 섹션 */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* 등급 선택 */}
                <div className="space-y-2">
                  <span className="text-[13px] font-medium text-gray-700">등급</span>
                  <div className="relative">
                    <select
                      value={workersEffort[worker.id]?.grade || ''}
                      onChange={(e) => setWorkersEffort(prev => ({
                        ...prev,
                        [worker.id]: {
                          ...prev[worker.id],
                          grade: e.target.value as Grade
                        }
                      }))}
                      className="w-full h-[38px] px-3 rounded-lg border border-gray-200 text-sm appearance-none bg-white focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                    >
                      <option value="">선택</option>
                      {grades.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 직급 선택 */}
                <div className="space-y-2">
                  <span className="text-[13px] font-medium text-gray-700">직급</span>
                  <div className="relative">
                    <select
                      value={workersEffort[worker.id]?.position || ''}
                      onChange={(e) => setWorkersEffort(prev => ({
                        ...prev,
                        [worker.id]: {
                          ...prev[worker.id],
                          position: e.target.value as Position
                        }
                      }))}
                      className="w-full h-[38px] px-3 rounded-lg border border-gray-200 text-sm appearance-none bg-white focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                    >
                      <option value="">선택</option>
                      {positions.map((position) => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* 단가 입력 */}
                <div className="space-y-2">
                  <span className="text-[13px] font-medium text-gray-700">단가</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={workersEffort[worker.id]?.unitPrice || ''}
                      onChange={(e) => setWorkersEffort(prev => ({
                        ...prev,
                        [worker.id]: {
                          ...prev[worker.id],
                          unitPrice: e.target.value === '' ? null : parseInt(e.target.value)
                        }
                      }))}
                      className="w-full h-[38px] px-3 rounded-lg border border-gray-200 text-sm focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                      placeholder="단가 입력"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                  </div>
                </div>
              </div>

              {/* 공수 입력 섹션 */}
              <div className="space-y-2">
                <span className="text-[13px] font-medium text-gray-700">공수</span>
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {getMonths().map((month) => (
                      <div key={`${worker.id}-${month}`} className="text-center flex-shrink-0">
                        <div className="text-[13px] text-gray-600 mb-2">{month}</div>
                        <input
                          type="number"
                          step="0.1"
                          value={workersEffort[worker.id]?.monthlyEfforts[month] || ''}
                          onChange={(e) => handleWorkerEffortChange(worker.id, month, e.target.value)}
                          className="w-[60px] h-[38px] px-2 rounded-lg border border-gray-200 text-sm text-center focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 투입소계 & 투입비용 섹션 */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-600">투입소계</span>
                    <span className="text-[15px] font-medium text-gray-900">
                      {(calculateTotalEffort(selectedTab) || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-600">투입비용</span>
                    <span className="text-[15px] font-medium text-gray-900">
                      {calculateTotalCost(selectedTab).toLocaleString()} 원
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 