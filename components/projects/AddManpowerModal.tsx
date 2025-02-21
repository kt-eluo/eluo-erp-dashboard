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

// 컴포넌트 상단에 현재 날짜 관련 상수 추가
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

// 직급별 단가 정의 수정
const POSITION_UNIT_PRICES: { [key: string]: number } = {
  '부장': 9_500_000,
  '차장': 8_500_000,
  '과장': 7_500_000,
  '대리/주임/사원': 6_500_000
};

// 직급에 따른 단가 반환 함수 추가
const getUnitPriceByPosition = (position: Position): number => {
  if (position === '부장') return POSITION_UNIT_PRICES['부장'];
  if (position === '차장') return POSITION_UNIT_PRICES['차장'];
  if (position === '과장') return POSITION_UNIT_PRICES['과장'];
  return POSITION_UNIT_PRICES['대리']; // 대리/주임/사원은 동일 단가
};

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

  // 상단에 기본 단가 설정을 위한 객체 추가
  const DEFAULT_PRICES = {
    '특급': 9_500_000,
    '고급': 8_500_000,
    '중급': 7_500_000,
    '초급': 6_500_000
  } as const

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
            grade,
            position,
            unit_price,
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
              grade: mp.grade,
              position: mp.position,
              unitPrice: mp.unit_price,
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
          if (!workerData) continue;

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
              role: role,
              grade: workerData.grade || null,
              position: workerData.position || null,
              unit_price: workerData.unitPrice || null
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
        updatedWorkers[role] = updatedWorkers[role].map(worker => {
          const monthKey = `${currentYear}-${currentMonth}`;  // 이제 정의된 상수 사용 가능
          const currentMonthEffort = workersEffort[`${worker.id}-${role}`]?.monthlyEfforts[monthKey];
          
          return {
            ...worker,
            monthlyEfforts: workersEffort[`${worker.id}-${role}`]?.monthlyEfforts || {},
            total_mm_value: currentMonthEffort || 0
          };
        });
      });

      onManpowerUpdate?.(updatedWorkers);
      onClose();
      toast.success('공수가 저장되었습니다.');
    } catch (error) {
      console.error('Error saving manpower:', error);
      toast.error('공수 저장 중 오류가 발생했습니다.');
    }
  };

  // getMonths 함수 수정
  const getMonths = useCallback(() => {
    if (!startDate || !endDate) return [];
    
    const months: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 시작일과 종료일을 각각 해당 월의 1일로 설정
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0); // 종료월의 마지막 날로 설정

    while (current <= lastMonth) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      months.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, [startDate, endDate]);

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

  // 등급 변경 핸들러
  const handleGradeChange = (workerId: string, role: string, value: Grade) => {
    setWorkersEffort(prev => ({
      ...prev,
      [`${workerId}-${role}`]: {
        ...prev[`${workerId}-${role}`] || {},
        grade: value as Grade,  // 타입 명시
        monthlyEfforts: prev[`${workerId}-${role}`]?.monthlyEfforts || {}
      }
    }));
  };

  // 직급 변경 핸들러 수정
  const handlePositionChange = (workerId: string, role: string, position: Position) => {
    setWorkersEffort(prev => {
      const workerKey = `${workerId}-${role}`;
      const currentEffort = prev[workerKey] || {};
      
      // 직급에 따른 단가 자동 설정
      const unitPrice = getUnitPriceByPosition(position);

      return {
        ...prev,
        [workerKey]: {
          ...currentEffort,
          position,
          unitPrice,
          monthlyEfforts: currentEffort.monthlyEfforts || {}
        }
      };
    });
  };

  // 단가 변경 핸들러는 그대로 유지 (수동 수정 가능)
  const handleUnitPriceChange = (workerId: string, role: string, value: string) => {
    const numericValue = value ? parseInt(value.replace(/[^\d]/g, '')) : 0;
    
    setWorkersEffort(prev => ({
      ...prev,
      [`${workerId}-${role}`]: {
        ...prev[`${workerId}-${role}`] || {},
        unitPrice: numericValue,
        monthlyEfforts: prev[`${workerId}-${role}`]?.monthlyEfforts || {}
      }
    }));
  };

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
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 단가 입력 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-gray-700">단가</span>
                    {/* 도움말 아이콘 */}
                    <div className="group relative">
                      <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium text-gray-400 bg-gray-100 rounded-full border border-gray-300 hover:text-gray-600 hover:bg-gray-50 cursor-help transition-colors">?</span>
                      <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 absolute right-0 w-[300px] bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm text-gray-600 z-50">
                        <p className="mb-2">직급별 기본 단가가 자동으로 적용됩니다.<br />필요한 경우 수정이 가능합니다.</p>
                        <div className="mt-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="py-1 text-left font-medium">직급</th>
                                <th className="py-1 text-right font-medium">기본 단가</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(POSITION_UNIT_PRICES).map(([position, price]) => (
                                <tr key={position} className="border-b last:border-0">
                                  <td className="py-1 text-left">{position}</td>
                                  <td className="py-1 text-right">{price.toLocaleString()}원</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={workersEffort[`${worker.id}-${selectedTab}`]?.unitPrice?.toLocaleString() || ''}
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
                      const [year, month] = monthKey.split('-');
                      const displayText = `${year}년 ${month}월`;
                      
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
                      );
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