'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Menu, X, Home, Users, Settings, LogOut, Calendar, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'

const data = [
  { month: '2024-01', amount: 30000000 },
  { month: '2024-02', amount: 0 },
  { month: '2024-03', amount: 0 },
  { month: '2024-04', amount: 0 },
  { month: '2024-05', amount: 0 },
  { month: '2024-06', amount: 0 },
  { month: '2024-07', amount: 0 },
  { month: '2024-08', amount: 0 },
  { month: '2024-09', amount: 0 },
  { month: '2024-10', amount: 0 },
  { month: '2024-11', amount: 0 },
  { month: '2024-12', amount: 0 },
]

const pieData = [
  { name: '수입', value: 30000000, color: '#4F46E5' },
  { name: '지출', value: 10000000, color: '#EF4444' },
]

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* 상단 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">매출조회</h1>
        </div>

        {/* 매출 통계 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">매출 통계</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => value.split('-')[1] + '월'}
                />
                <YAxis 
                  tickFormatter={(value) => `${formatCurrency(value)}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${formatCurrency(value)}원`, '매출']}
                  labelFormatter={(label) => `${label.split('-')[0]}년 ${label.split('-')[1]}월`}
                />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 수입/지출 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">수입/지출 현황</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${formatCurrency(value)}원`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">거래 내역</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">거래처 A</p>
                  <p className="text-sm text-gray-500">2024-01-15</p>
                </div>
                <p className="text-blue-600 font-medium">+ ₩15,000,000</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">거래처 B</p>
                  <p className="text-sm text-gray-500">2024-01-10</p>
                </div>
                <p className="text-blue-600 font-medium">+ ₩15,000,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* 정산 현황 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">정산 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">이번 달 정산</p>
              <p className="text-2xl font-bold">₩30,000,000</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="text-green-500 mr-1">↑ 50%</span>
                <span>전월 대비</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">총 정산액</p>
              <p className="text-2xl font-bold">₩30,000,000</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="text-green-500 mr-1">↑ 50%</span>
                <span>전년 대비</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 