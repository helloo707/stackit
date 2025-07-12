'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BadgeQuestionMark, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    totalBookmarks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
        setDashboardStats(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    if (session?.user.role === 'admin') {
      fetchDashboardStats();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Welcome, {session?.user.name}. Here&apos;s an overview of the platform.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalUsers}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
            <BadgeQuestionMark className="h-8 w-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalQuestions}</div>
            <div className="text-sm text-gray-500">Total Questions</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
            <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalAnswers}</div>
            <div className="text-sm text-gray-500">Total Answers</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
            <BookOpen className="h-8 w-8 text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalBookmarks}</div>
            <div className="text-sm text-gray-500">Total Bookmarks</div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
            <Button className="w-full mb-2">Manage Users</Button>
            <Button variant="outline" className="w-full">User Roles</Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h3>
            <Button className="w-full mb-2">Moderate Questions</Button>
            <Button variant="outline" className="w-full">Moderate Answers</Button>
          </div>
        </div>
      </div>
    </div>
  );
} 