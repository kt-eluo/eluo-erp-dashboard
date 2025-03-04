'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'

interface Worker {
  id: string;
  name: string;
  job_type: string;
  worker_type: '임직원' | '협력사임직원' | '프리랜서(기업)' | '프리랜서(개인)';
  grade?: string;  // 직무 등급
  level?: string;  // 기술 등급
}

interface EmployeeLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'all' | 'available';
}

export default function EmployeeLookupModal({ isOpen, onClose, mode }: EmployeeLookupModalProps) {
  const [selectedTab, setSelectedTab] = useState('기획');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const supabase = createClientComponentClient();

  // 전체 인력 조회 함수
  const fetchAllWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, job_type, grade, level, worker_type')
        .is('deleted_at', null)
        .order('name');

      if (error) {
        console.error('Error fetching all workers:', error);
        toast.error('전체 인력 정보를 불러오는데 실패했습니다.');
        return;
      }

      setWorkers(data || []);
    } catch (error) {
      console.error('Error in fetchAllWorkers:', error);
      toast.error('전체 인력 정보를 불러오는데 실패했습니다.');
    }
  };

  // 유효 인력 조회 함수
  const fetchAvailableWorkers = async () => {
    try {
      // 1. 전체 workers 조회
      const { data: allWorkers, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .is('deleted_at', null);

      if (workersError) {
        console.error('전체 인력 조회 중 오류:', workersError);
        throw new Error('전체 인력 정보 조회 중 오류 발생');
      }

      // 2. 프로젝트에 투입된 인력 ID 조회
      const { data: assignedWorkers, error: assignedError } = await supabase
        .from('project_manpower')
        .select('worker_id');

      if (assignedError) {
        console.error('투입 인력 조회 중 오류:', assignedError);
        throw new Error('투입 인력 정보 조회 중 오류 발생');
      }

      // 투입된 인력 ID 세트 생성
      const assignedWorkerIds = new Set(
        (assignedWorkers || [])
          .map(w => w.worker_id)
          .filter(Boolean)
      );

      // 3. 투입되지 않은 인력만 필터링
      const availableWorkers = (allWorkers || []).filter(
        worker => !assignedWorkerIds.has(worker.id)
      );

      setWorkers(availableWorkers);
    } catch (error) {
      console.error('Error fetching available workers:', error);
      toast.error('유효 인력 정보를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'all') {
        fetchAllWorkers();
      } else {
        fetchAvailableWorkers();
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }} 
        />
        <div 
          className="relative bg-white rounded-lg w-full max-w-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {mode === 'all' ? '전체 인력' : '유효 인력'}
            </h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* 탭 */}
          <div className="flex space-x-1 mb-4">
            {['기획', '디자인', '퍼블리싱', '개발', '기타'].map((tab) => {
              const count = workers.filter(worker => worker.job_type === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${selectedTab === tab
                      ? 'bg-[#4E49E7] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {`${tab}(${count})`}
                </button>
              );
            })}
          </div>

          {/* 인력 목록 */}
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {workers
              .filter(worker => worker.job_type === selectedTab)
              .map(worker => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">{worker.name}</span>
                    {worker.grade && (
                      <span className="text-sm text-gray-600">
                        {worker.grade}
                      </span>
                    )}
                    {worker.level && (
                      <span className="text-sm text-gray-600">
                        {worker.level}
                      </span>
                    )}
                  </div>
                  {worker.worker_type && (
                    <span className={`text-sm px-2 py-1 rounded ${
                      mode === 'available'
                        ? 'bg-green-100 text-green-800'
                        : worker.worker_type === '임직원'
                          ? 'bg-[#FF6B6B] text-white'
                          : worker.worker_type === '협력사임직원'
                            ? 'bg-[#3DAF07] text-white'
                            : worker.worker_type === '프리랜서(기업)'
                              ? 'bg-[#1D89EA] text-white'
                              : worker.worker_type === '프리랜서(개인)'
                                ? 'bg-[#FF00BF] text-white'
                                : ''
                    }`}>
                      {mode === 'available' ? '' : worker.worker_type}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}