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
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg p-6 w-[1000px] max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">공수 추가</h2>
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
              onClick={() => onClose()}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {Object.entries(selectedWorkers || {}).map(([role, workers]) => (
              workers.length > 0 && (
                <button
                  key={role}
                  onClick={() => setSelectedTab(role as Role)}
                  className={`py-4 px-1 text-sm font-medium border-b-2 ${
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

        {/* 선택된 직무의 실무자들 공수 입력 영역 */}
        <div className="space-y-8">
          {selectedWorkers[selectedTab]?.map((worker, index) => (
            <div 
              key={worker.id}
              className={`p-4 rounded-lg ${
                index > 0 ? 'border-t border-gray-200 mt-4' : ''
              }`}
            >
              {/* 실무자 이름 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-20 text-[13px] text-gray-500">이름</span>
                <div className="w-[200px] h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] text-sm flex items-center">
                  {worker.name}
                </div>
              </div>

              {/* 등급 선택 (드롭다운) */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-[13px] text-gray-500">등급</span>
                <div className="relative w-[200px]">
                  <select
                    value={workersEffort[worker.id]?.grade || ''}
                    onChange={(e) => setWorkersEffort(prev => ({
                      ...prev,
                      [worker.id]: {
                        ...prev[worker.id],
                        grade: e.target.value as Grade
                      }
                    }))}
                    className="w-full h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] text-sm appearance-none bg-white"
                  >
                    <option value="">선택</option>
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 직급 선택 (드롭다운) */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-[13px] text-gray-500">직급</span>
                <div className="relative w-[200px]">
                  <select
                    value={workersEffort[worker.id]?.position || ''}
                    onChange={(e) => setWorkersEffort(prev => ({
                      ...prev,
                      [worker.id]: {
                        ...prev[worker.id],
                        position: e.target.value as Position
                      }
                    }))}
                    className="w-full h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] text-sm appearance-none bg-white"
                  >
                    <option value="">선택</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 단가 입력 */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-[13px] text-gray-500">단가</span>
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
                  className="w-[200px] h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] text-sm"
                  placeholder="단가 입력"
                />
                <span className="text-gray-500">원</span>
              </div>

              {/* 공수 입력 */}
              <div className="flex items-start gap-2">
                <span className="w-20 text-[13px] text-gray-500 mt-[6px]">공수</span>
                <div className="w-[calc(100%-5rem)] relative">
                  <div className="overflow-x-auto rounded-[6px] p-4">
                    <div className="flex gap-4 min-w-max">
                      {getMonths().map((month) => (
                        <div key={`${worker.id}-${month}`} className="text-center flex-shrink-0">
                          <div className="text-[13px] text-gray-500 mb-1">{month}</div>
                          <input
                            type="number"
                            step="0.1"
                            value={workersEffort[worker.id]?.monthlyEfforts[month] || ''}
                            onChange={(e) => handleWorkerEffortChange(worker.id, month, e.target.value)}
                            className="w-[60px] h-[31px] px-2 rounded-[6px] border border-[#B8B8B8] text-sm text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 투입소계 & 투입비용 */}
              <div className="flex items-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-[13px] text-gray-500">투입소계</span>
                  <span className="text-[14px]">
                    {(calculateTotalEffort(selectedTab) || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-[13px] text-gray-500">투입비용</span>
                  <span className="text-[14px]">
                    {calculateTotalCost(selectedTab).toLocaleString()} 원
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 