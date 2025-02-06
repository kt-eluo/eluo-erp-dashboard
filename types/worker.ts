export type WorkerJobType = '기획' | '디자인' | '퍼블리싱' | '개발'
export type WorkerLevelType = '초급' | '중급' | '고급'

export interface Worker {
  id?: string
  name: string
  job_type: WorkerJobType | null
  level: WorkerLevelType | null
  price: number | null
  is_dispatched: boolean
  created_at?: string
}

export interface WorkerMMRecord {
  id?: string
  worker_id: string
  year: number
  month: number
  mm_value: number
  created_at?: string
} 