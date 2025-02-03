'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface TestData {
  id: number
  name: string
  created_at: string
}

export default function SupabaseTest() {
  const [data, setData] = useState<TestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: testData, error } = await supabase
          .from('test_table')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setData(testData || [])
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (error) {
    return <div>에러: {error}</div>
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">테스트 테이블 데이터</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">이름</th>
                <th className="px-4 py-2">생성일</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-center">{item.id}</td>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">
                    {new Date(item.created_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}