'use client'

import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !role || !allowedRoles.includes(role))) {
      router.push('/auth/login');
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}