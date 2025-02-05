export type WorkerJobType = '기획' | '디자인' | '퍼블리싱' | '개발';
export type WorkerLevelType = '초급' | '중급' | '고급';

export interface Worker {
  id: string;
  name: string;
  job_type: WorkerJobType;
  level: WorkerLevelType;
  price: number;
  is_dispatched: boolean;
  created_at: string;
  updated_at: string;
} 