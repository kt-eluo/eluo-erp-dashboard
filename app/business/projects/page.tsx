'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Project, ProjectStatus, ProjectManpower, ProjectCategory } from '@/types/project'
import { Search, Plus, LayoutGrid, Table, FileSpreadsheet, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AddProjectSlideOver from '@/components/projects/AddProjectSlideOver'
import { Dialog, Transition } from '@headlessui/react'

const ITEMS_PER_PAGE = 20

// 로딩 스피너 컴포넌트 분리
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 border-t-[#4E49E7] animate-spin" />
  </div>
)

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all')
  const [viewType, setViewType] = useState<'table' | 'card'>('card')
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all')
  const [isAddSlideOverOpen, setIsAddSlideOverOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isDetailSlideOverOpen, setIsDetailSlideOverOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const statusTypes: ProjectStatus[] = ['준비중', '진행중', '완료', '보류']
  const categoryTypes: ProjectCategory[] = ['운영', '구축', '개발', '기타']

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      let query = supabase
        .from('projects')
        .select(`
          *,
          project_manpower (
            id,
            worker_id,
            role,
            mm_value
          )
        `)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        const transformedData = data.map(project => ({
          ...project,
          manpower: project.project_manpower || []
        }))
        setProjects(transformedData as Project[])
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error.message || error)
      toast.error('프로젝트 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
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

  const handleProjectSubmit = async (projectData: Project & { _action?: 'delete' }) => {
    try {
      if (projectData._action === 'delete') {
        // 삭제 로직
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectData.id)

        if (error) throw error
        toast.success('프로젝트가 삭제되었습니다.')
        fetchProjects()
        return
      }

      // 프로젝트 목록 새로고침만 수행
      await fetchProjects()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('프로젝트 저장 중 오류가 발생했습니다.')
    }
  }

  const handleProjectDetail = (project: Project) => {
    setSelectedProject(project)
    setIsDetailSlideOverOpen(true)
  }

  // 카테고리 변경 핸들러 추가
  const handleCategoryChange = async (category: ProjectCategory | 'all') => {
    setIsLoading(true)  // 로딩 시작
    setSelectedCategory(category)
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast.success('프로젝트가 삭제되었습니다.')
      fetchProjects() // 목록 새로고침
    } catch (error: any) {
      console.error('Error:', error.message || error)
      toast.error('프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [selectedCategory, selectedStatus, searchTerm])

  // 현재 페이지의 데이터만 가져오는 함수
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return projects.slice(startIndex, endIndex)
  }

  // 총 페이지 수 계산
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE)

  if (isLoading) {
    return (
      <LoadingSpinner />
    )
  }

  return (
    <div className="">
      <div className="p-4 sm:p-6 bg-white min-h-screen">
        {/* 헤더 영역 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-[18px] sm:text-[20px] font-semibold">프로젝트 관리</h1>
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
              onClick={() => setIsAddSlideOverOpen(true)}
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
            <form onSubmit={handleSearch} className="relative flex w-full sm:w-[400px]">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#4E49E7] focus:border-[#4E49E7] text-[13px]"
                  placeholder="프로젝트 검색"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-[13px] text-black bg-white hover:text-white border border-gray-400 rounded-r-md hover:bg-[#4E49E7] transition-colors duration-200"
              >
                검색
              </button>
            </form>


            {/* 뷰 타입 전환 버튼 수정 */}
            <button 
              onClick={() => setViewType(viewType === 'card' ? 'table' : 'card')}
              className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {viewType === 'card' ? (
                <>
                  <Table className="w-4 h-4" />
                  테이블 형식
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  카드 형식
                </>
              )}
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => handleCategoryChange('all')}
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
                onClick={() => handleCategoryChange(category)}
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
        {viewType === 'card' ? (
          <div>
            {/* 카드 뷰 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className="border border-[#CFCFCF] rounded-[8px] p-6 hover:border-[#4E49E7] transition-colors duration-200"
                >
                  {/* 상단 영역: 프로젝트명과 삭제 버튼 */}
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleProjectDetail(project)}
                    >
                      <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // 이벤트 버블링 방지
                        setProjectToDelete(project.id)
                        setIsDeleteModalOpen(true)
                      }}
                      className="p-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 기존 프로젝트 정보 */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleProjectDetail(project)}
                  >
                    <div className="flex align-center justify-between">
                      <div>
                        {/* 계약 기간 */}
                        <div className="flex items-center font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F]">
                          <span className="mr-2">계약 기간 :</span>
                          <span>
                            {project.start_date && project.end_date ? 
                              `${new Date(project.start_date).toLocaleDateString('ko-KR', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit'
                              }).replace(/\. /g, '.').slice(0, -1)} ~ ${
                                new Date(project.end_date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }).replace(/\. /g, '.').slice(0, -1)
                              }` 
                              : '기간 미설정'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2 w-[50%]">
                        <button type="button" className="w-[49%] h-[44px] bg-[#FFFF01] rounded-[6px] font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">실무자 공수 관리</button>
                        <button type="button" className="w-[49%] h-[44px] bg-[#4E49E7] rounded-[6px] font-pretendard font-semibold text-[16px] leading-[19.09px] text-white">마일스톤 등록 및 확인</button>
                      </div>
                    </div>

                    {/* 해당월 공수진행 섹션 */}
                    <div className="mt-8">
                      {/* 타이틀 */}
                      <h4 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mb-4">
                        {new Date().getMonth() + 1}월 진행 공수
                      </h4>

                      {/* 직무별 공수 목록 */}
                      <div className="space-y-4 flex flex-row items-baseline gap-2">
                        {/* 기획 */}
                        <div className="w-[25%]">
                          <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                            기획
                          </span>
                          <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                            <li className="flex justify-between relative pl-3">
                              <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                              <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                홍길동A
                              </span>
                              <div className="flex items-baseline">
                                <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                              </div>
                            </li>
                            <li className="flex justify-between relative pl-3">
                              <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                              <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                홍길동B
                              </span>
                              <div className="flex items-baseline">
                                <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.5</span>
                                <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                              </div>
                            </li>
                          </ul>
                        </div>

                        {/* 디자이너 */}
                        <div className="w-[25%]">
                          <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                            디자이너
                          </span>
                          <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                            <li className="flex justify-between relative pl-3">
                              <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                              <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                홍길동C
                              </span>
                              <div className="flex items-baseline">
                                <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                              </div>
                            </li>
                          </ul>
                        </div>

                        {/* 퍼블리셔 */}
                        <div className="w-[25%]">
                          <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                            퍼블리셔
                          </span>
                          <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                            <li className="flex justify-between relative pl-3">
                              <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                              <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                홍길동D
                              </span>
                              <div className="flex items-baseline">
                                <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                              </div>
                            </li>
                          </ul>
                        </div>

                        {/* 개발 */}
                        <div className="w-[25%]">
                          <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F] mb-2 block">
                            개발
                          </span>
                          <ul className="space-y-1 bg-[#ECECEC] rounded-[8px] p-4">
                            <li className="flex justify-between relative pl-3">
                              <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                              <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                홍길동E
                              </span>
                              <div className="flex items-baseline">
                                <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.7</span>
                                <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                              </div>
                            </li>
                            <li className="flex justify-between relative pl-3">
                              <div className="absolute left-0 top-[0.6em] w-[3px] h-[3px] rounded-full bg-[#5A5A5A]" />
                              <span className="font-pretendard font-normal text-[16px] leading-[19.09px] text-[#5A5A5A]">
                                홍길동F
                              </span>
                              <div className="flex items-baseline">
                                <span className="font-pretendard font-semibold text-[16px] leading-[19.09px] text-black">0.8</span>
                                <span className="font-pretendard font-normal text-[12px] leading-[14.32px] ml-1">M/M</span>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 테이블 뷰 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="w-[60px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">번호</th>
                      <th className="w-[250px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">프로젝트명</th>
                      <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">시작일</th>
                      <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">종료일</th>
                      <th className="w-[120px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">상태</th>
                      <th className="w-[200px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">예산</th>
                      <th className="w-[150px] px-6 py-4 text-right text-[13px] font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projects.map((project, index) => (
                      <tr 
                        key={project.id}
                        className="hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-500">{index + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">{project.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.start_date ? 
                              new Date(project.start_date).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1) 
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.end_date ? 
                              new Date(project.end_date).toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0, -1) 
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium
                            ${project.status === '진행중' ? 'bg-green-50 text-green-700' :
                              project.status === '준비중' ? 'bg-yellow-50 text-yellow-700' :
                              project.status === '보류' ? 'bg-gray-50 text-gray-700' :
                              'bg-blue-50 text-blue-700'}`}>
                            {project.status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.budget ? `${project.budget.toLocaleString()}원` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            className="text-[13px] text-[#4E49E7] hover:text-[#3F3ABE]"
                            onClick={() => handleProjectDetail(project)}
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

        {/* 프로젝트 추가 슬라이드오버 */}
        <AddProjectSlideOver
          isOpen={isAddSlideOverOpen}
          onClose={() => setIsAddSlideOverOpen(false)}
          onSubmit={handleProjectSubmit}
        />

        {/* 프로젝트 상세 슬라이드오버 */}
        <AddProjectSlideOver
          isOpen={isDetailSlideOverOpen}
          onClose={() => {
            setIsDetailSlideOverOpen(false)
            setSelectedProject(null)
          }}
          onSubmit={handleProjectSubmit}
          project={selectedProject}
          mode="edit"
        />

        {/* 삭제 확인 모달 */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={() => setIsDeleteModalOpen(false)} />
              
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">
                        프로젝트 삭제
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          정말 삭제하시겠습니까?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      if (projectToDelete) {
                        handleDeleteProject(projectToDelete)
                        setIsDeleteModalOpen(false)
                        setProjectToDelete(null)
                      }
                    }}
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => {
                      setIsDeleteModalOpen(false)
                      setProjectToDelete(null)
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 