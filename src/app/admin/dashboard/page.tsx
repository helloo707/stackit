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
  ShieldCheck,
  MessageSquare,
  Flag,
  Trash2,
  Settings,
  Eye
} from 'lucide-react';
import Link from 'next/link';

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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Welcome, {session?.user.name}. Here&apos;s an overview of the platform and quick access to admin tools.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        {/* Admin Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Content Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <BadgeQuestionMark className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Content Management</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Manage questions and answers on the platform.
            </p>
            <div className="space-y-2">
              <Link href="/admin/questions">
                <Button variant="outline" className="w-full justify-start">
                  <BadgeQuestionMark className="h-4 w-4 mr-2" />
                  Manage Questions
                </Button>
              </Link>
              <Link href="/admin/answers">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Manage Answers
                </Button>
              </Link>
            </div>
          </div>

          {/* Moderation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Flag className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Moderation</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Review and moderate flagged content.
            </p>
            <div className="space-y-2">
              <Link href="/admin/flags">
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="h-4 w-4 mr-2" />
                  Flagged Content
                </Button>
              </Link>
            </div>
          </div>

          {/* Deleted Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Deleted Content</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Restore or permanently delete soft deleted content.
            </p>
            <div className="space-y-2">
              <Link href="/admin/deleted-content">
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deleted Content
                </Button>
              </Link>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Manage user accounts and permissions.
            </p>
            <div className="space-y-2">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Settings className="h-4 w-4 mr-2" />
                User Roles
              </Button>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              View platform analytics and insights.
            </p>
            <div className="space-y-2">
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Platform Analytics
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Common admin tasks and shortcuts.
            </p>
            <div className="space-y-2">
              <Link href="/questions">
                <Button variant="outline" className="w-full justify-start">
                  <BadgeQuestionMark className="h-4 w-4 mr-2" />
                  View All Questions
                </Button>
              </Link>
              <Link href="/admin/flags">
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="h-4 w-4 mr-2" />
                  Review Flags
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity or Notifications */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center text-gray-500 py-8">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity to display</p>
            <p className="text-sm">Activity monitoring coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 