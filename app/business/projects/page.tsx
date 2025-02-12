'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Project, ProjectStatus } from '@/types/project'
import { Search, Plus, LayoutGrid, Table, FileSpreadsheet, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'

const ITEMS_PER_PAGE = 20

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all')
  const [viewType, setViewType] = useState<'table' | 'card'>('table')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const statusTypes: ProjectStatus[] = ['준비중', '진행중', '완료', '보류']
  const categoryTypes = ['운영', '구축', '개발', '기타']

  const fetchProjects = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          client,
          start_date,
          end_date,
          status,
          budget,
          description,
          created_at
        `)
        .order('created_at', { ascending: false })
        
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,client.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching projects:', error)
        toast.error('프로젝트 목록을 불러오는데 실패했습니다.')
        return
      }

      setProjects(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('프로젝트 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setSearchTerm(searchInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [selectedStatus, searchTerm])

  // 현재 페이지의 데이터만 가져오는 함수
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return projects.slice(startIndex, endIndex)
  }

  // 총 페이지 수 계산
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 p-8">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* 헤더 영역 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <div className="flex items-center gap-3">
            {/* 엑셀 파일 버튼 */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              파일
            </button>
            
            {/* 필터 버튼 */}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </button>

            {/* 추가 버튼 */}
            <button
              onClick={() => router.push('/business/projects/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#4E49E7] hover:bg-[#3F3ABE] focus:outline-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 프로젝트
            </button>
          </div>
        </div>

        {/* 검색 및 뷰 타입 전환 영역 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 검색창 */}
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="프로젝트명 검색"
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E49E7] focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* 뷰 타입 전환 버튼 수정 */}
            <button 
              onClick={() => setViewType(viewType === 'table' ? 'card' : 'table')}
              className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {viewType === 'table' ? (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  카드 형식
                </>
              ) : (
                <>
                  <Table className="w-4 h-4" />
                  테이블 형식
                </>
              )}
            </button>
          </div>
        </div>

        {/* 대분류 탭 */}
        <div className="mb-6">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${selectedCategory === 'all'
                  ? 'bg-[#4E49E7] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              전체
            </button>
            {categoryTypes.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${selectedCategory === category
                    ? 'bg-[#4E49E7] text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {/* 안내 메시지 */}
        <div className="mb-6 text-[13px] sm:text-sm">
          <div className="flex items-center text-black-500 bg-gray-50 px-3 sm:px-4 py-3 rounded-lg">
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            프로젝트는 기간에 따라 자동으로 상태가 설정돼요.
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {viewType === 'table' ? (
          <div>
            {/* 테이블 뷰 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="w-[60px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">번호</th>
                      <th className="w-[250px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">프로젝트명</th>
                      <th className="w-[200px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">고객사</th>
                      <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">시작일</th>
                      <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">종료일</th>
                      <th className="w-[120px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">상태</th>
                      <th className="w-[200px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">예산</th>
                      <th className="w-[150px] px-6 py-4 text-right text-[13px] font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getCurrentPageData().map((project, index) => (
                      <tr 
                        key={project.id}
                        className="hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-500">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">{project.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">{project.client}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium
                            ${project.status === '진행중' ? 'bg-green-50 text-green-700' :
                              project.status === '완료' ? 'bg-blue-50 text-blue-700' :
                              project.status === '보류' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-gray-50 text-gray-700'}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.budget ? `${new Intl.NumberFormat('ko-KR').format(project.budget)}원` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => router.push(`/business/projects/${project.id}`)}
                            className="text-[13px] text-[#4E49E7] hover:text-[#3F3ABE]"
                          >
                            상세보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* 카드 뷰 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {getCurrentPageData().map((project) => (
                <div 
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium
                        ${project.status === '진행중' ? 'bg-green-50 text-green-700' :
                          project.status === '완료' ? 'bg-blue-50 text-blue-700' :
                          project.status === '보류' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-[13px] text-gray-500">
                        <span className="w-16">고객사</span>
                        <span className="text-gray-900">{project.client}</span>
                      </div>
                      <div className="flex items-center text-[13px] text-gray-500">
                        <span className="w-16">시작일</span>
                        <span className="text-gray-900">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center text-[13px] text-gray-500">
                        <span className="w-16">종료일</span>
                        <span className="text-gray-900">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex items-center text-[13px] text-gray-500">
                        <span className="w-16">예산</span>
                        <span className="text-gray-900">
                          {project.budget ? `${project.budget.toLocaleString()}원` : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => router.push(`/business/projects/${project.id}`)}
                        className="flex-1 py-1.5 text-[12px] font-medium text-[#4E49E7] hover:bg-[#4E49E7]/5 rounded-lg transition-colors"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
} 