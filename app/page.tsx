import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['CPO', 'BD', 'PM']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold">대시보드</h1>
        {/* 대시보드 내용 */}
      </div>
    </ProtectedRoute>
  );
}