export type ProjectStatus = '준비중' | '진행중' | '완료' | '보류'
export type ProjectCategory = '운영' | '구축' | '개발' | '기타'
export type ProjectMajorCategory = '금융' | '커머스' | 'AI' | '기타'
export type ContractType = '회차 정산형' | '정기 결제형'
export type PeriodicUnit = 'month' | 'week'

export type ProjectRole = 'BD(BM)' | 'PM(PL)' | '기획' | '디자이너' | '퍼블리셔' | '개발'

export interface ProjectManpower {
  id: string
  project_id: string
  worker_id: string
  role: ProjectRole
  mm_value: number
  created_at?: string
  updated_at?: string
}

export interface ManpowerSummary {
  planning?: number | null
  design?: number | null
  publishing?: number | null
  development?: number | null
}

export interface Project {
  id: string
  name: string
  client?: string
  description?: string
  start_date?: string
  end_date?: string
  status?: ProjectStatus
  category?: ProjectCategory
  major_category?: ProjectMajorCategory
  budget?: number
  
  // 계약 정보
  contract_type?: ContractType
  is_vat_included?: boolean
  common_expense?: number
  
  // 회차 정산형 정보
  down_payment?: number
  intermediate_payments?: number[]
  final_payment?: number
  
  // 정기 결제형 정보
  periodic_unit?: PeriodicUnit
  periodic_interval?: number
  periodic_amount?: number
  
  // 실무자 정보 추가
  manpower?: ProjectManpower[]
  // 공수 요약 정보 추가
  manpower_summary?: ManpowerSummary
  
  // 직무별 전체 공수 정보
  planning_manpower?: number | null;
  design_manpower?: number | null;
  publishing_manpower?: number | null;
  development_manpower?: number | null;
  
  created_at?: string
  updated_at?: string
} 