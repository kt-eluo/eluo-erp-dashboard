export type ProjectStatus = '준비중' | '진행중' | '완료' | '보류'

export interface Project {
  id?: string
  name: string
  client: string
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  budget: number | null
  description: string | null
  created_at?: string
} 