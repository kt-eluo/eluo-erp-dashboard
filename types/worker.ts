export type WorkerJobType = '기획' | '디자인' | '퍼블리싱' | '개발' | '기타'
export type WorkerLevelType = '초급' | '중급' | '고급' | '특급'
export type WorkerType = '임직원' | '협력사임직원' | '프리랜서(기업)' | '프리랜서(개인)'
export type WorkerGrade = 'BD' | 'BM' | 'PM' | 'PL' | 'PA'

export interface Worker {
  id?: string
  name: string
  worker_type: WorkerType | null
  grade: WorkerGrade | null
  job_type: WorkerJobType | null
  level: WorkerLevelType | null
  price: number | null
  is_dispatched: boolean | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface WorkerMMRecord {
  id?: string
  worker_id: string
  year: number
  month: number
  mm_value: number
  created_at?: string
} 