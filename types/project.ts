export type ProjectStatus = '준비중' | '진행중' | '완료' | '보류'
export type ProjectCategory = '운영' | '구축' | '개발' | '기타'
export type ProjectMajorCategory = '금융' | '커머스' | 'AI' | '기타'
export type ContractType = '회차 정산형' | '정기 결제형'
export type PeriodicUnit = 'month' | 'week'

export interface ProjectManpower {
  id?: string
  project_id: string
  role: '기획' | '디자인' | '퍼블리싱' | '개발'
  grade?: string
  position?: string
  unit_price?: number
  monthly_efforts: { [key: string]: number }
  total_effort: number
  total_cost: number
  created_at?: string
  updated_at?: string
}

export interface Project {
  id?: string
  name: string                                  // 필수
  client?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: ProjectStatus | null
  budget?: number | null
  category?: ProjectCategory | null
  major_category?: ProjectMajorCategory | null
  description?: string | null
  
  // 계약 관련 정보
  contract_type?: ContractType | null
  is_vat_included?: boolean
  common_expense?: number | null
  
  // 회차 정산형 정보
  down_payment?: number | null
  intermediate_payments?: number[] | null
  final_payment?: number | null
  
  // 정기 결제형 정보
  periodic_unit?: PeriodicUnit | null
  periodic_interval?: number | null
  periodic_amount?: number | null
  
  // 직무별 전체 공수 정보 추가
  planning_manpower?: number | null      // 기획 전체 공수
  design_manpower?: number | null        // 디자인 전체 공수
  publishing_manpower?: number | null    // 퍼블리싱 전체 공수
  development_manpower?: number | null   // 개발 전체 공수
  
  created_at?: string
  updated_at?: string
  manpower?: ProjectManpower[]
} 