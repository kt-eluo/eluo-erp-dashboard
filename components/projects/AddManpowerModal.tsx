import { useState, useCallback, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

type Grade = 'BD' | 'BM' | 'PM' | 'PL' | 'PA' | ''  // 데이터베이스의 worker_grade_type enum 값과 일치
type Position = '부장' | '차장' | '과장' | '대리' | '주임' | '사원' | ''
type Role = 'BD(BM)' | 'PM(PL)' | '기획' | '디자이너' | '퍼블리셔' | '개발' | 'all' | '';

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
    [key: string]: Array<{
      id: string;
      name: string;
      job_type: string;
      mm_value?: number;
      monthlyEfforts?: { [key: string]: number | null };
    }>
  }
  onManpowerUpdate?: (updatedWorkers: { [key: string]: Array<{ id: string; name: string; job_type: string; mm_value?: number; monthlyEfforts?: { [key: string]: number | null } }> }) => void
}

interface WorkerEffortData {
  grade?: Grade | null;
  position?: Position | null;
  unitPrice?: number | null;
  monthlyEfforts: { [key: string]: number | null };
  total_mm_value: number;
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

// 직급에 따른 단가 반환 함수 수정
const getUnitPriceByPosition = (position: Position): number => {
  if (position === '대리' || position === '주임' || position === '사원') {
    return POSITION_UNIT_PRICES['대리/주임/사원'];
  }
  return POSITION_UNIT_PRICES[position] || 6_500_000;
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
  // selectedTab을 'all'로 고정
  const [selectedTab] = useState<Role>('all')
  
  // state 키 형식 변경: `${workerId}-${role}`
  const [workersEffort, setWorkersEffort] = useState<{ [key: string]: WorkerEffortData }>({})

  // 수정 모드 상태 추가
  const [isEditMode, setIsEditMode] = useState(false)

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

  // Role 라벨 매핑 추가
  const roleLabels: Record<Role, string> = {
    'BD(BM)': 'BD(BM)',
    'PM(PL)': 'PM(PL)',
    '기획': '기획',
    '디자이너': '디자이너',
    '퍼블리셔': '퍼블리셔',
    '개발': '개발',
    'all': '전체',
    '': '선택'
  }

  // loadManpowerData 함수를 useEffect 밖으로 이동
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
          
          mp.project_monthly_efforts?.forEach((effort: { year: number; month: number; mm_value: number | null }) => {
            const monthKey = `${effort.year}-${effort.month}`;
            monthlyEfforts[monthKey] = effort.mm_value;
          });

          newWorkersEffort[key] = {
            monthlyEfforts,
            total_mm_value: calculateTotalMMValue(monthlyEfforts)
          };
        });

        setWorkersEffort(newWorkersEffort);
      }
    } catch (error) {
      console.error('Error loading manpower data:', error);
    }
  };

  // 기존 데이터 로딩 수정
  useEffect(() => {
    if (projectId && startDate && endDate) {
      loadManpowerData();
    }
  }, [projectId, startDate, endDate]);

  // 월별 공수 데이터 가져오는 함수 수정 - fetchMonthlyEfforts는 이제 loadManpowerData에 통합
  const fetchMonthlyEfforts = async () => {
    await loadManpowerData();
  };

  // 저장 핸들러 수정
  const handleSave = async () => {
    try {
      for (const [role, workers] of Object.entries(selectedWorkers)) {
        for (const worker of workers) {
          const workerData = workersEffort[`${worker.id}-${role}`];
          if (!workerData) continue;

          // 1. project_manpower 데이터 저장/업데이트
          const { data: manpower, error: manpowerError } = await supabase
            .from('project_manpower')
            .upsert({
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

          // 2. 기존 월별 공수 데이터 삭제
          if (manpower.id) {
            const { error: deleteError } = await supabase
              .from('project_monthly_efforts')
              .delete()
              .eq('project_manpower_id', manpower.id);

            if (deleteError) {
              console.error('Error deleting existing monthly efforts:', deleteError);
              throw deleteError;
            }

            // 3. 새로운 월별 공수 데이터 저장
            if (workerData.monthlyEfforts && Object.keys(workerData.monthlyEfforts).length > 0) {
              const monthlyEffortsData = Object.entries(workerData.monthlyEfforts)
                .filter(([_, value]) => value !== null && value !== 0)
                .map(([monthKey, value]) => {
                  const [year, month] = monthKey.split('-').map(Number);
                  return {
                    project_manpower_id: manpower.id,
                    year,
                    month,
                    mm_value: value
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
      }

      // 저장 완료 후 데이터 업데이트
      const updatedWorkers = {...selectedWorkers};
      Object.keys(updatedWorkers).forEach(role => {
        updatedWorkers[role] = updatedWorkers[role].map(worker => ({
          ...worker,
          monthlyEfforts: workersEffort[`${worker.id}-${role}`]?.monthlyEfforts || {},
          total_mm_value: calculateTotalMMValue(workersEffort[`${worker.id}-${role}`]?.monthlyEfforts || {})
        }));
      });

      // 부모 컴포넌트에 업데이트 알림
      if (onManpowerUpdate) {
        await onManpowerUpdate(updatedWorkers);
      }

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

  // 월별 공수 데이터 처리 함수 수정
  const handleWorkerEffortChange = (workerId: string, role: string, monthKey: string, value: string) => {
    const inputKey = `${workerId}-${role}-${monthKey}`;
    const workerKey = `${workerId}-${role}`;

    // 빈 문자열 처리
    if (value === '') {
      setTempInputs(prev => ({ ...prev, [inputKey]: '' }));
      setWorkersEffort(prev => {
        const currentEffort = prev[workerKey] || { 
          monthlyEfforts: {}, 
          total_mm_value: 0,
          grade: null,
          position: null,
          unitPrice: null
        };
        const currentMonthlyEfforts = { ...currentEffort.monthlyEfforts };
        currentMonthlyEfforts[monthKey] = null;

        return {
          ...prev,
          [workerKey]: {
            ...currentEffort,
            monthlyEfforts: currentMonthlyEfforts,
            total_mm_value: calculateTotalMMValue(currentMonthlyEfforts)
          }
        };
      });
      return;
    }

    // 유효한 입력값 검사 (소수점 또는 숫자만 허용)
    if (!/^[0-9.]*$/.test(value)) {
      return;
    }

    // 소수점이 하나만 있는지 확인
    if ((value.match(/\./g) || []).length > 1) {
      return;
    }

    // 임시 입력값 업데이트
    setTempInputs(prev => ({ ...prev, [inputKey]: value }));

    // 유효한 숫자인 경우에만 실제 상태 업데이트
    if (value !== '.') {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 1) {
        setWorkersEffort(prev => {
          const currentEffort = prev[workerKey] || { 
            monthlyEfforts: {}, 
            total_mm_value: 0,
            grade: null,
            position: null,
            unitPrice: null
          };
          const currentMonthlyEfforts = { ...currentEffort.monthlyEfforts };
          currentMonthlyEfforts[monthKey] = numericValue;

          return {
            ...prev,
            [workerKey]: {
              ...currentEffort,
              monthlyEfforts: currentMonthlyEfforts,
              total_mm_value: calculateTotalMMValue(currentMonthlyEfforts)
            }
          };
        });
      }
    }
  };

  // 부모 컴포넌트 상태 업데이트를 위한 useEffect 제거 (불필요)

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

  // 단가 수동 변경 핸들러는 그대로 유지
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

  // 공수 계산 로직 수정
  const calculateTotalMMValue = (monthlyEfforts: { [key: string]: number | null }): number => {
    return Object.values(monthlyEfforts).reduce((acc: number, curr: number | null) => {
      return acc + (curr ?? 0);
    }, 0);
  };

  // 수정 완료 핸들러
  const handleEditComplete = async () => {
    await handleSave();
    await loadManpowerData(); // 데이터 즉시 업데이트
    setIsEditMode(false);
  };

  // 직무별 총 공수 계산 함수 추가
  const calculateRoleTotalEffort = (role: string) => {
    return selectedWorkers[role]?.reduce((total, worker) => {
      return total + calculateTotalEffort(worker.id, role);
    }, 0) || 0;
  };

  // 직무별 총 투입 금액 계산 함수 추가
  const calculateRoleTotalCost = (role: string) => {
    return selectedWorkers[role]?.reduce((total, worker) => {
      return total + calculateTotalCost(worker.id, role);
    }, 0) || 0;
  };

  const [tempInputs, setTempInputs] = useState<{[key: string]: string}>({});

  // 공수 복사 관련 상태 추가
  const [effortCopyChecks, setEffortCopyChecks] = useState<{[key: string]: boolean}>({});

  // 공수 복사 체크박스 핸들러
  const handleEffortCopyChange = (workerId: string, role: string, monthKey: string, checked: boolean) => {
    if (!isEditMode) return;

    const workerKey = `${workerId}-${role}`;
    
    // 체크박스 상태 업데이트
    setEffortCopyChecks(prev => ({
      ...prev,
      [workerKey]: checked
    }));

    // 체크 활성화 시에만 공수 복사 수행
    if (checked) {
      const firstMonthValue = workersEffort[workerKey]?.monthlyEfforts[monthKey];
      if (typeof firstMonthValue === 'number') {
        const months = getMonths();
        
        // 모든 월에 첫 월의 공수값 적용
        const newMonthlyEfforts = months.reduce((acc, month) => {
          acc[month] = firstMonthValue;
          return acc;
        }, {} as {[key: string]: number | null});

        // 공수 데이터 업데이트
        setWorkersEffort(prev => ({
          ...prev,
          [workerKey]: {
            ...prev[workerKey],
            monthlyEfforts: newMonthlyEfforts,
            total_mm_value: calculateTotalMMValue(newMonthlyEfforts)
          }
        }));

        // 입력값 업데이트
        const newTempInputs = months.reduce((acc, month) => {
          acc[`${workerId}-${role}-${month}`] = firstMonthValue.toString();
          return acc;
        }, {} as {[key: string]: string});

        setTempInputs(prev => ({
          ...prev,
          ...newTempInputs
        }));
      }
    }
  };

  // 모달 열릴 때 체크박스 초기화
  useEffect(() => {
    if (isOpen) {
      setEffortCopyChecks({});
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-auto">
      {/* 배경 오버레이의 z-index 설정 */}
      <div 
        className="absolute inset-0 bg-black/25 z-[999998]" 
        onClick={onClose} 
      />
      
      {/* 모달 컨테이너의 z-index를 더 높게 설정하고 중복 제거 */}
      <div className="relative bg-white rounded-lg pl-6 pr-6 pb-6 w-[1000px] max-h-[90vh] overflow-y-auto z-[999999]">
        {/* 헤더 */}
        <div className="flex justify-between items-center pt-6 pb-6 sticky top-0 bg-white z-20">
          <h2 className="text-lg font-semibold">공수 관리</h2>
          <div className="flex items-center gap-2">
            {/* 수정/수정완료 버튼 */}
            <button
              type="button"
              className="px-4 h-[32px] bg-[#4E49E7] text-white rounded-[6px] text-sm font-medium hover:bg-[#3F3ABE] transition-colors"
              onClick={isEditMode ? handleEditComplete : () => setIsEditMode(true)}
            >
              {isEditMode ? '수정완료' : '수정'}
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

        {/* 컨텐츠 영역 */}
        <div className="relative z-10">
          {/* 전체 탭 컨텐츠 */}
          <div className="mt-4">
            <div className="overflow-x-auto whitespace-nowrap" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="min-w-full divide-y divide-gray-200 border-t border-gray-200 border-b">
                <thead className="bg-gray-50">
                  <tr>
                    <td className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">직무 구분</td>
                    <td className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">실무자</td>
                    <td className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">등급</td>
                    <td className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">직급</td>
                    <td className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">단가</td>
                    {startDate && endDate && getMonths().map((month) => (
                      <td key={month} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        {month}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(selectedWorkers).map(([role, workers]) =>
                    workers.map((worker) => {
                      const workerKey = `${worker.id}-${role}`;
                      const workerData = workersEffort[workerKey] || {};
                      
                      return (
                        <tr key={`${role}-${worker.id}`}>
                          <td className="px-2 py-2 text-sm text-gray-900 sticky left-0 bg-white">{role}</td>
                          <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">{worker.name}</td>
                          <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {isEditMode ? (
                              <select
                                value={workerData.grade || ''}
                                onChange={(e) => handleGradeChange(worker.id, role, e.target.value as Grade)}
                                className="w-[60px] h-[38px] px-3 rounded-lg border border-gray-200 text-sm appearance-none bg-white focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                              >
                                <option value="">선택</option>
                                {grades.map((grade) => (
                                  <option key={grade} value={grade}>{gradeLabels[grade]}</option>
                                ))}
                              </select>
                            ) : (
                              <span>{workerData.grade || '-'}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {isEditMode ? (
                              <select
                                value={workerData.position || ''}
                                onChange={(e) => handlePositionChange(worker.id, role, e.target.value as Position)}
                                className="w-[60px] h-[38px] px-3 rounded-lg border border-gray-200 text-sm appearance-none bg-white focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                              >
                                <option value="">선택</option>
                                {positions.map((position) => (
                                  <option key={position} value={position}>{position}</option>
                                ))}
                              </select>
                            ) : (
                              <span>{workerData.position || '-'}</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {isEditMode ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={workerData.unitPrice?.toLocaleString() || ''}
                                  onChange={(e) => handleUnitPriceChange(worker.id, role, e.target.value)}
                                  className="w-[160px] h-[38px] px-3 rounded-lg border border-gray-200 text-sm focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all pr-[30px]"
                                  placeholder="단가 입력"
                                />
                                <span className="absolute left-[138px] top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                              </div>
                            ) : (
                              <span>{workerData.unitPrice?.toLocaleString() || '-'} 원</span>
                            )}
                          </td>
                          {startDate && endDate && getMonths().map((monthKey, index) => (
                            <td key={monthKey} className="px-2 py-2 text-center text-sm text-gray-900 whitespace-nowrap">
                              {isEditMode ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={tempInputs[`${worker.id}-${role}-${monthKey}`] ?? (workerData.monthlyEfforts?.[monthKey]?.toString() || '')}
                                    onChange={(e) => handleWorkerEffortChange(worker.id, role, monthKey, e.target.value)}
                                    className="w-[60px] h-[38px] px-2 rounded-lg border border-gray-200 text-sm text-center focus:border-[#4E49E7] focus:ring-1 focus:ring-[#4E49E7] transition-all"
                                  />
                                  {/* 첫 월의 공수값을 모든 월에 적용 */}
                                  {isEditMode && index === 0 && (
                                    <input
                                      type="checkbox"
                                      checked={effortCopyChecks[`${worker.id}-${role}`] || false}
                                      onChange={(e) => handleEffortCopyChange(worker.id, role, monthKey, e.target.checked)}
                                      className="w-4 h-4 text-[#4E49E7] border-gray-300 rounded focus:ring-[#4E49E7] cursor-pointer"
                                      title="체크박스 선택 시 해당 공수가 전체 적용 됩니다."
                                    />
                                  )}
                                </div>
                              ) : (
                                <span>{workerData.monthlyEfforts?.[monthKey] || '-'}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 프로젝트 총 합산 영역 추가 */}
          <div className="mt-8 border-t pt-6">
            <div className="flex gap-5 bg-gray-50 p-4 rounded-lg">
              {['PM(PL)', '기획', '디자이너', '퍼블리셔', '개발'].map((role) => (
                <div key={role} className="flex-1 bg-white rounded-lg p-2">
                  <div className="text-center">
                    <div className="text-[28px] font-bold mb-1">
                      {Number(calculateRoleTotalEffort(role).toFixed(3)).toString()}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {calculateRoleTotalCost(role).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 