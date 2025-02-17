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
}

export default function AddManpowerModal({ isOpen, onClose, startDate, endDate }: AddManpowerModalProps) {
  const [selectedTab, setSelectedTab] = useState<Role>('기획')
  const [entries, setEntries] = useState<ManpowerEntry[]>([])
  const [selectedGrades, setSelectedGrades] = useState<{ [key: string]: Grade }>({})
  const [selectedPositions, setSelectedPositions] = useState<{ [key: string]: Position }>({})
  const [selectedNames, setSelectedNames] = useState<{ [key: string]: string }>({
    '기획': '홍길동',
    '디자인': '김철수',
    '퍼블리싱': '이영희',
    '개발': '박지민'
  })
  
  const grades: Grade[] = ['미지정', '특급', '고급', '중급', '초급']
  const positions: Position[] = ['부장', '차장', '과장', '대리', '주임', '사원']
  const roles: Role[] = ['기획', '디자인', '퍼블리싱', '개발']

  // 공수 입력값을 관리하는 state 추가
  const [monthlyEfforts, setMonthlyEfforts] = useState<{
    [role: string]: { [month: string]: number | null }
  }>({
    '기획': {},
    '디자인': {},
    '퍼블리싱': {},
    '개발': {}
  })

  // 단가 state 추가
  const [unitPrices, setUnitPrices] = useState<{
    [role: string]: number | null
  }>({
    '기획': null,
    '디자인': null,
    '퍼블리싱': null,
    '개발': null
  })

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
  const calculateTotalEffort = (role: Role) => {
    const efforts = monthlyEfforts[role]
    if (!efforts) return 0
    
    return Object.values(efforts).reduce((sum, value) => {
      return sum + (value || 0)
    }, 0)
  }

  // 공수 입력 핸들러
  const handleEffortChange = (month: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setMonthlyEfforts(prev => ({
      ...prev,
      [selectedTab]: {
        ...prev[selectedTab],
        [month]: numValue
      }
    }))
  }

  // 단가 입력 핸들러
  const handleUnitPriceChange = (value: string) => {
    const numValue = value === '' ? null : parseInt(value)
    setUnitPrices(prev => ({
      ...prev,
      [selectedTab]: numValue
    }))
  }

  // 투입비용 계산 함수
  const calculateTotalCost = (role: Role) => {
    const totalEffort = calculateTotalEffort(role)
    const unitPrice = unitPrices[role]
    
    if (!unitPrice) return 0
    return totalEffort * unitPrice
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 1000 }}
    >
      <div 
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={() => onClose()}
      />
      
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
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedTab(role)}
                className={`py-4 px-1 text-sm font-medium border-b-2 ${
                  selectedTab === role
                    ? 'border-[#4E49E7] text-[#4E49E7]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {role}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="space-y-4">
          {/* 이름 표시 */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-[13px] text-gray-500">이름</span>
            <div className="w-[200px] h-[31px] px-3 rounded-[6px] border border-[#B8B8B8] text-sm flex items-center">
              {selectedNames[selectedTab]}
            </div>
          </div>

          {/* 등급 선택 (드롭다운) */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-[13px] text-gray-500">등급</span>
            <div className="relative w-[200px]">
              <select
                value={selectedGrades[selectedTab] || ''}
                onChange={(e) => setSelectedGrades({
                  ...selectedGrades,
                  [selectedTab]: e.target.value as Grade
                })}
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
                value={selectedPositions[selectedTab] || ''}
                onChange={(e) => setSelectedPositions({
                  ...selectedPositions,
                  [selectedTab]: e.target.value as Position
                })}
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
              value={unitPrices[selectedTab] || ''}
              onChange={(e) => handleUnitPriceChange(e.target.value)}
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
                    <div key={month} className="text-center flex-shrink-0">
                      <div className="text-[13px] text-gray-500 mb-1">{month}</div>
                      <input
                        type="number"
                        step="0.1"
                        value={monthlyEfforts[selectedTab][month] || ''}
                        onChange={(e) => handleEffortChange(month, e.target.value)}
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
              <span className="text-[14px]">{calculateTotalEffort(selectedTab).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-[13px] text-gray-500">투입비용</span>
              <span className="text-[14px]">
                {calculateTotalCost(selectedTab).toLocaleString()} 원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 