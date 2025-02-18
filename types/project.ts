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
  
  // 계약 정보 추가
  is_vat_included?: boolean
  common_expense?: number
  contract_type?: ContractType
  
  // 회차 정산형 정보
  down_payment?: number
  intermediate_payments?: number[]
  final_payment?: number
  
  // 정기 결제형 정보
  periodic_unit?: PeriodicUnit
  periodic_interval?: number
  periodic_amount?: number
  
  // 직무별 전체 공수 정보 - DB 컬럼명과 일치하도록 수정
  planning_manpower?: number | null
  design_manpower?: number | null
  publishing_manpower?: number | null
  development_manpower?: number | null
  
  // 프론트엔드용 변환 데이터 구조
  manpower?: {
    planning?: number | null
    design?: number | null
    publishing?: number | null
    development?: number | null
  }
  
  created_at?: string
  updated_at?: string
} 