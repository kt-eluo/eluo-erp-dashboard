export type ProjectStatus = '준비중' | '진행중' | '완료' | '보류'
export type ProjectCategory = '운영' | '구축' | '개발' | '기타'
export type ProjectMajorCategory = string  // 필요한 값들로 타입 지정 가능

export interface Project {
  id?: string
  name: string
  client: string
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  budget: number | null
  category: ProjectCategory | null
  major_category: ProjectMajorCategory | null
  description: string | null
  created_at?: string
} 