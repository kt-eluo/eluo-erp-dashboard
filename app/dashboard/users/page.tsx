'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/auth'

interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUserRole()
    fetchUsers()
  }, [])

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'CPO') {
        router.push('/dashboard')
      }
      setCurrentUserRole(profile?.role as UserRole)
    }
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    setUsers(data)
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // 1. user_profiles 테이블 업데이트
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (profileError) throw profileError

      // 2. auth.users 메타데이터 업데이트
      const { error: authError } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      })

      if (authError) throw authError

      // 3. 사용자 목록 새로고침
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('권한 변경에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (currentUserRole !== 'CPO') {
    return <div className="p-4">접근 권한이 없습니다.</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">사용자 관리</h1>
      <div className="bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                현재 권한
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                권한 변경
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="CPO">CPO</option>
                    <option value="BD/BM">BD/BM</option>
                    <option value="PM/PL">PM/PL</option>
                    <option value="PA">PA</option>
                    <option value="Client">Client</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 