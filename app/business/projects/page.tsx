'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Project, ProjectStatus, ProjectManpower } from '@/types/project'
import { Search, Plus, LayoutGrid, Table, FileSpreadsheet, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import AddProjectSlideOver from '@/components/projects/AddProjectSlideOver'

const ITEMS_PER_PAGE = 20

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all')
  const [viewType, setViewType] = useState<'table' | 'card'>('card')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddSlideOverOpen, setIsAddSlideOverOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const statusTypes: ProjectStatus[] = ['준비중', '진행중', '완료', '보류']
  const categoryTypes = ['운영', '구축', '개발', '기타']

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
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
          category,
          major_category,
          description
        `)

      const { data, error } = await query

      if (error) throw error

      if (data) {
        setProjects(data as Project[])
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

  const handleAddProject = async (projectData: Project) => {
    try {
      setIsLoading(true)
      
      // 1. 프로젝트 기본 정보 저장
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (projectError) throw projectError

      // 2. 공수 정보가 있다면 저장
      if (projectData.manpower && projectData.manpower.length > 0) {
        const { error: manpowerError } = await supabase
          .from('project_manpower')
          .insert(
            projectData.manpower.map((mp: ProjectManpower) => ({
              ...mp,
              project_id: newProject.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          )

        if (manpowerError) throw manpowerError
      }

      toast.success('프로젝트가 추가되었습니다.')
      setIsAddSlideOverOpen(false)
      fetchProjects()
    } catch (error: any) {
      console.error('Error:', error.message || error)
      toast.error('프로젝트 추가 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 border-t-[#4E49E7] animate-spin" />
      </div>
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
        {viewType === 'card' ? (
          <div>
            {/* 카드 뷰 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 임시로 4개의 동일한 카드 생성 */}
              {[1, 2, 3, 4].map((index) => (
                <div 
                  key={index}
                  className="border border-[#CFCFCF] rounded-[8px] p-6 hover:border-[#4E49E7] transition-colors duration-200"
                >
                  <div className="flex align-center justify-between">
                    <div>
                      {/* 프로젝트 제목 */}
                      <h3 className="font-pretendard font-bold text-[20px] leading-[23.87px] text-black mb-2">
                        KT Shop (UI/UX) 기획 및 운영 유지보수
                      </h3>

                      {/* 계약 기간 */}
                      <div className="flex items-center font-pretendard font-normal text-[16px] leading-[19.09px] text-[#6F6F6F]">
                        <span className="mr-2">계약 기간 :</span>
                        <span>2025. 01. 31 ~ 2025. 12. 31</span>
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
                      2월 진행 공수
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
                      <th className="w-[200px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">고객사</th>
                      <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">시작일</th>
                      <th className="w-[150px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">종료일</th>
                      <th className="w-[120px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">상태</th>
                      <th className="w-[200px] px-6 py-4 text-left text-[13px] font-medium text-gray-500">예산</th>
                      <th className="w-[150px] px-6 py-4 text-right text-[13px] font-medium text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      {
                        id: 1,
                        name: 'KT Shop (UI/UX) 기획 및 운영 유지보수',
                        client: 'KT',
                        start_date: '2025-01-31',
                        end_date: '2025-12-31',
                        status: '진행중',
                        budget: 30000000
                      },
                      {
                        id: 2,
                        name: 'SK 하이닉스 채용 사이트 구축',
                        client: 'SK 하이닉스',
                        start_date: '2025-02-01',
                        end_date: '2025-08-31',
                        status: '준비중',
                        budget: 25000000
                      },
                      {
                        id: 3,
                        name: '현대자동차 딜러 관리 시스템 개발',
                        client: '현대자동차',
                        start_date: '2025-03-15',
                        end_date: '2025-12-31',
                        status: '진행중',
                        budget: 40000000
                      },
                      {
                        id: 4,
                        name: '삼성전자 글로벌 마케팅 플랫폼 구축',
                        client: '삼성전자',
                        start_date: '2025-04-01',
                        end_date: '2025-10-31',
                        status: '보류',
                        budget: 35000000
                      }
                    ].map((project, index) => (
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
                          <span className="text-[14px] text-gray-900">{project.client}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {new Date(project.start_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {new Date(project.end_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium
                            ${project.status === '진행중' ? 'bg-green-50 text-green-700' :
                              project.status === '준비중' ? 'bg-yellow-50 text-yellow-700' :
                              project.status === '보류' ? 'bg-gray-50 text-gray-700' :
                              'bg-blue-50 text-blue-700'}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-900">
                            {project.budget.toLocaleString()}원
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
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
          onSubmit={handleAddProject}
        />
      </div>
    </div>
  )
} 