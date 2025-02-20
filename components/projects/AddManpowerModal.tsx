import { useState, useCallback, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

type Grade = 'BD' | 'BM' | 'PM' | 'PL' | 'PA' | ''  // 데이터베이스의 worker_grade_type enum 값과 일치
type Position = '부장' | '차장' | '과장' | '대리' | '주임' | '사원' | ''
type Role = 'BD(BM)' | 'PM(PL)' | '기획' | '디자이너' | '퍼블리셔' | '개발' | ''

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
  projectId: string
  startDate: Date | null
  endDate: Date | null
  selectedWorkers: {
    [key: string]: Array<{ id: string; name: string; job_type: string }>
  }
  onManpowerUpdate?: (updatedWorkers: { [key: string]: Array<{ id: string; name: string; job_type: string }> }) => void
}

interface WorkerEffortData {
  grade?: Grade | null;           // null 허용
  position?: Position | null;     // null 허용
  unitPrice?: number | null;      // null 허용
  monthlyEfforts: {
    [key: string]: number | null; // null 허용
  };
}

export default function AddManpowerModal({ 
  isOpen, 
  onClose, 
  projectId, 
  startDate, 
  endDate,
  selectedWorkers,
  onManpowerUpdate
}: AddManpowerModalProps) {
  // 초기 탭을 실무자가 있는 첫 번째 직무로 설정
  const [selectedTab, setSelectedTab] = useState<Role>(() => {
    const firstRoleWithWorkers = Object.entries(selectedWorkers || {})
      .find(([_, workers]) => workers.length > 0)?.[0] as Role
    return firstRoleWithWorkers || '기획'
  })
  
  // state 키 형식 변경: `${workerId}-${role}`
  const [workersEffort, setWorkersEffort] = useState<{
    [workerIdWithRole: string]: WorkerEffortData;
  }>({})

  const grades: Grade[] = ['BD', 'BM', 'PM', 'PL', 'PA']
  const positions: Position[] = ['부장', '차장', '과장', '대리', '주임', '사원']
  const roles: Role[] = ['BD(BM)', 'PM(PL)', '기획', '디자이너', '퍼블리셔', '개발']

  // 화면에 표시할 때는 한글로 변환하는 매핑 추가
  const gradeLabels: Record<Grade, string> = {
    'BD': 'BD',
    'BM': 'BM',
    'PM': 'PM',
    'PL': 'PL',
    'PA': 'PA',
    '': '선택'
  }

  // Role 라벨 매핑 추가 (필요한 경우)
  const roleLabels: Record<Role, string> = {
    'BD(BM)': 'BD(BM)',
    'PM(PL)': 'PM(PL)',
    '기획': '기획',
    '디자이너': '디자이너',
    '퍼블리셔': '퍼블리셔',
    '개발': '개발',
    '': '선택'
  }

  // 기존 데이터 로딩 수정
  useEffect(() => {
    const loadManpowerData = async () => {
      if (!projectId) return;

      try {
        const { data: manpowerData } = await supabase
          .from('project_manpower')
          .select(`
            id,
            worker_id,
            role,
            project_monthly_efforts (
              year,
              month,
              mm_value
            )
          `)
          .eq('project_id', projectId);

        if (manpowerData) {
          // 기존 데이터로 workersEffort 상태 초기화
          const newWorkersEffort: { [key: string]: WorkerEffortData } = {};
          
          manpowerData.forEach(mp => {
            const key = `${mp.worker_id}-${mp.role}`;
            const monthlyEfforts: { [key: string]: number | null } = {};
            
            mp.project_monthly_efforts?.forEach(effort => {
              const monthKey = `${effort.year}-${effort.month}`;
              monthlyEfforts[monthKey] = effort.mm_value;
            });

            newWorkersEffort[key] = {
              monthlyEfforts
            };
          });

          setWorkersEffort(newWorkersEffort);
        }
      } catch (error) {
        console.error('Error loading manpower data:', error);
      }
    };

    loadManpowerData();
  }, [projectId]);

  // selectedTab 설정 로직 수정
  useEffect(() => {
    const firstRoleWithWorkers = Object.entries(selectedWorkers)
      .find(([_, workers]) => workers.length > 0)?.[0] as Role;
    
    if (firstRoleWithWorkers) {
      setSelectedTab(firstRoleWithWorkers);
    }
  }, [selectedWorkers]);

  // 저장 핸들러
  const handleSave = async () => {
    try {
      for (const [role, workers] of Object.entries(selectedWorkers)) {
        for (const worker of workers) {
          const workerData = workersEffort[`${worker.id}-${role}`];
          if (!workerData) {
            console.log(`No data for worker: ${worker.id}`);
            continue;
          }

          // 1. 기존 데이터 확인
          const { data: existingData, error: fetchError } = await supabase
            .from('project_manpower')
            .select('id')
            .match({
              project_id: projectId,
              worker_id: worker.id,
              role: role
            })
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching existing data:', fetchError);
            throw fetchError;
          }

          // 2. project_manpower 데이터 저장/업데이트
          const { data: manpower, error: manpowerError } = await supabase
            .from('project_manpower')
            .upsert({
              id: existingData?.id,
              project_id: projectId,
              worker_id: worker.id,
              role: role as any,
              grade: workerData.grade || null,
              position: workerData.position || null,
              unit_price: workerData.unitPrice || null,
            }, {
              onConflict: 'project_id,worker_id,role'
            })
            .select()
            .single();

          if (manpowerError) {
            console.error('Error saving to project_manpower:', manpowerError);
            throw manpowerError;
          }

          // 3. 기존 월별 공수 데이터 삭제 (해당 project_manpower_id의 데이터만)
          if (manpower.id) {
            const { error: deleteError } = await supabase
              .from('project_monthly_efforts')
              .delete()
              .eq('project_manpower_id', manpower.id);

            if (deleteError) {
              console.error('Error deleting existing monthly efforts:', deleteError);
              throw deleteError;
            }
          }

          // 4. 새로운 월별 공수 데이터 저장
          if (workerData.monthlyEfforts && Object.keys(workerData.monthlyEfforts).length > 0) {
            const monthlyEffortsData = Object.entries(workerData.monthlyEfforts)
              .filter(([_, value]) => value !== null && value !== 0) // null이나 0이 아닌 값만 저장
              .map(([monthKey, value]) => {
                const [year, month] = monthKey.split('-').map(Number);
                return {
                  project_manpower_id: manpower.id,
                  year,
                  month,
                  mm_value: value,
                };
              });

            if (monthlyEffortsData.length > 0) {
              const { error: insertError } = await supabase
                .from('project_monthly_efforts')
                .insert(monthlyEffortsData);

              if (insertError) {
                console.error('Error saving monthly efforts:', insertError);
                throw insertError;
              }
            }
          }
        }
      }

      // 저장 완료 후 부모 컴포넌트에 업데이트된 데이터 전달
      const updatedWorkers = {...selectedWorkers};
      Object.keys(updatedWorkers).forEach(role => {
        updatedWorkers[role] = updatedWorkers[role].map(worker => ({
          ...worker,
          total_mm_value: workersEffort[`${worker.id}-${role}`]?.monthlyEfforts
            ? Object.values(workersEffort[`${worker.id}-${role}`].monthlyEfforts)
                .reduce((sum, val) => sum + (Number(val) || 0), 0)
            : 0
        }));
      });

      onManpowerUpdate?.(updatedWorkers);
      onClose();
      toast.success('공수가 저장되었습니다.');
    } catch (error) {
      console.error('Error saving manpower:', error);
      toast.error('공수 저장 중 오류가 발생했습니다.');
    }
  };

  // 월 목록 생성 함수 수정
  const getMonths = useCallback(() => {
    if (!startDate || !endDate) return []
    
    const months: string[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      months.push(`${year}-${month}`)
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return months
  }, [startDate, endDate])

  // 투입소계 계산 함수 수정
  const calculateTotalEffort = (workerId: string, role: string) => {
    const key = `${workerId}-${role}`;
    const workerData = workersEffort[key]
    if (!workerData?.monthlyEfforts) return 0

    return Object.values(workerData.monthlyEfforts).reduce((sum: number, value) => {
      return sum + (value || 0)
    }, 0)
  }

  // 실무자별 공수 입력 핸들러
  const handleWorkerEffortChange = (workerId: string, role: string, monthKey: string, value: string) => {
    const key = `${workerId}-${role}`;
    const numValue = value === '' ? null : parseFloat(value)
    setWorkersEffort(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        monthlyEfforts: {
          ...(prev[key]?.monthlyEfforts || {}),
          [monthKey]: numValue
        }
      }
    }))
  }

  // 투입비용 계산 함수 수정
  const calculateTotalCost = (workerId: string, role: string) => {
    const key = `${workerId}-${role}`;
    const workerData = workersEffort[key]
    if (!workerData?.monthlyEfforts || !workerData.unitPrice) return 0

    const effort = calculateTotalEffort(workerId, role)
    return effort * workerData.unitPrice
  }

  // select 변경 핸들러 수정
  const handleGradeChange = (workerId: string, role: string, grade: Grade) => {
    const key = `${workerId}-${role}`;
    setWorkersEffort(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || {},
        grade,
        position: prev[key]?.position || '',
        unitPrice: prev[key]?.unitPrice || null,
        monthlyEfforts: prev[key]?.monthlyEfforts || {}
      }
    }))
  }

  const handlePositionChange = (workerId: string, role: string, position: Position) => {
    const key = `${workerId}-${role}`;
    setWorkersEffort(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || {},
        grade: prev[key]?.grade || '',
        position,
        unitPrice: prev[key]?.unitPrice || null,
        monthlyEfforts: prev[key]?.monthlyEfforts || {}
      }
    }))
  }

  const handleUnitPriceChange = (workerId: string, role: string, value: string) => {
    const unitPrice = value === '' ? null : parseInt(value)
    const key = `${workerId}-${role}`;
    setWorkersEffort(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || {},
        grade: prev[key]?.grade || '',
        position: prev[key]?.position || '',
        unitPrice,
        monthlyEfforts: prev[key]?.monthlyEfforts || {}
      }
    }))
  }

  // 공수 값이 변경될 때 부모 컴포넌트에 알림
  const handleManpowerChange = (workerId: string, value: number) => {
    const updatedWorkers = {...selectedWorkers};
    Object.keys(updatedWorkers).forEach(role => {
      const worker = updatedWorkers[role].find(w => w.id === workerId);
      if (worker) {
        worker.mm_value = value;
      }
    });
    
    onManpowerUpdate?.(updatedWorkers);
  };

  // 공수 계산 로직 수정
  const calculateTotalMM = (monthlyEfforts: Record<string, number | null>): number => {
    return Object.values(monthlyEfforts)
      .reduce((sum: number, val: number | null) => sum + (Number(val) || 0), 0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-auto">
      {/* 배경 오버레이의 z-index 설정 */}
      <div 
        className="absolute inset-0 bg-black/25 z-[999998]" 
        onClick={onClose} 
      />
      
      {/* 모달 컨테이너의 z-index를 더 높게 설정하고 중복 제거 */}
      <div className="relative bg-white rounded-lg pl-6 pr-6 pb-6 w-[700px] max-h-[90vh] overflow-y-auto z-[999999]">
        {/* 헤더 */}
        <div className="flex justify-between items-center pt-6 pb-6 sticky top-0 bg-white z-20">
          <h2 className="text-lg font-semibold">공수 관리</h2>
          <div className="flex items-center gap-2">
            {/* 저장 버튼 */}
            <button
              type="button"
              className="px-4 h-[32px] bg-[#4E49E7] text-white rounded-[6px] text-sm font-medium hover:bg-[#3F3ABE] transition-colors"
              onClick={handleSave}
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
                  <span className="text-[16px] font-bold text-gray-900">{worker.name}</span>
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
                      value={workersEffort[`${worker.id}-${selectedTab}`]?.grade || ''}
                      onChange={(e) => handleGradeChange(worker.id, selectedTab, e.target.value as Grade)}
                      className="w-full h-[38px] px-3 rounded-lg border border-gray-200 text-sm appearance-none bg-white focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                    >
                      <option value="">선택</option>
                      {grades.map((grade) => (
                        <option key={grade} value={grade}>{gradeLabels[grade]}</option>
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
                      value={workersEffort[`${worker.id}-${selectedTab}`]?.position || ''}
                      onChange={(e) => handlePositionChange(worker.id, selectedTab, e.target.value as Position)}
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
                      value={workersEffort[`${worker.id}-${selectedTab}`]?.unitPrice || ''}
                      onChange={(e) => handleUnitPriceChange(worker.id, selectedTab, e.target.value)}
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
                    {getMonths().map((monthKey) => {
                      const [year, month] = monthKey.split('-')
                      const displayText = `${year}년 ${month}월`
                      
                      return (
                        <div key={`${worker.id}-${selectedTab}-${monthKey}`} className="text-center flex-shrink-0">
                          <div className="text-[13px] text-gray-600 mb-2">{displayText}</div>
                          <input
                            type="number"
                            step="0.1"
                            value={workersEffort[`${worker.id}-${selectedTab}`]?.monthlyEfforts[monthKey] || ''}
                            onChange={(e) => handleWorkerEffortChange(worker.id, selectedTab, monthKey, e.target.value)}
                            className="w-[60px] h-[38px] px-2 rounded-lg border border-gray-200 text-sm text-center focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 투입소계 & 투입비용 섹션 */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-600">투입소계</span>
                    <span className="text-[15px] font-medium text-gray-900">
                      {(calculateTotalEffort(worker.id, selectedTab) || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-600">투입비용</span>
                    <span className="text-[15px] font-medium text-gray-900">
                      {calculateTotalCost(worker.id, selectedTab).toLocaleString()} 원
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