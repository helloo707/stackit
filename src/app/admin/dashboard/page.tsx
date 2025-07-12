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
  Eye,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart3,
  Database,
  Key,
  Zap
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground font-inter">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground font-inter">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid and Pattern Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid z-0"></div>
        <div className="absolute inset-0 bg-pattern z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue/5 via-purple/5 to-emerald/5"></div>
        </div>
      </div>
      
      <div className="relative z-10 pt-16">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue/10 rounded-2xl">
                <ShieldCheck className="h-8 w-8 text-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-orbitron font-inter">Admin Dashboard</h1>
                <p className="text-muted-foreground font-inter">
                  Welcome back, {session?.user.name}. Manage your platform with powerful admin tools.
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue/10 rounded-xl">
                  <Users className="h-6 w-6 text-blue" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-foreground font-inter mb-2">{dashboardStats.totalUsers.toLocaleString()}</div>
              <div className="text-muted-foreground font-inter">Total Users</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald/10 rounded-xl">
                  <BadgeQuestionMark className="h-6 w-6 text-emerald" />
                </div>
                <Activity className="h-5 w-5 text-blue opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-foreground font-inter mb-2">{dashboardStats.totalQuestions.toLocaleString()}</div>
              <div className="text-muted-foreground font-inter">Total Questions</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-purple" />
                </div>
                <MessageSquare className="h-5 w-5 text-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-foreground font-inter mb-2">{dashboardStats.totalAnswers.toLocaleString()}</div>
              <div className="text-muted-foreground font-inter">Total Answers</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange/10 rounded-xl">
                  <BookOpen className="h-6 w-6 text-orange" />
                </div>
                <Zap className="h-5 w-5 text-purple opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-foreground font-inter mb-2">{dashboardStats.totalBookmarks.toLocaleString()}</div>
              <div className="text-muted-foreground font-inter">Total Bookmarks</div>
            </div>
          </div>

          {/* Admin Tools Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Content Management */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue/10 rounded-lg">
                    <Database className="h-5 w-5 text-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground font-inter">Content Management</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/admin/questions">
                    <Button variant="outline" className="w-full justify-start h-12 text-left p-4 hover:bg-blue/5 hover:border-blue transition-all">
                      <BadgeQuestionMark className="h-5 w-5 mr-3 text-blue" />
                      <div>
                        <div className="font-semibold text-foreground">Manage Questions</div>
                        <div className="text-sm text-muted-foreground">Review and moderate questions</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/admin/answers">
                    <Button variant="outline" className="w-full justify-start h-12 text-left p-4 hover:bg-emerald/5 hover:border-emerald transition-all">
                      <MessageSquare className="h-5 w-5 mr-3 text-emerald" />
                      <div>
                        <div className="font-semibold text-foreground">Manage Answers</div>
                        <div className="text-sm text-muted-foreground">Review and moderate answers</div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple/10 rounded-lg">
                    <Zap className="h-5 w-5 text-purple" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground font-inter">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <Link href="/questions">
                    <Button variant="outline" className="w-full justify-start hover:bg-blue/5 hover:border-blue transition-all">
                      <BadgeQuestionMark className="h-4 w-4 mr-2" />
                      View All Questions
                    </Button>
                  </Link>
                  <Link href="/admin/flags">
                    <Button variant="outline" className="w-full justify-start hover:bg-red/5 hover:border-red transition-all">
                      <Flag className="h-4 w-4 mr-2" />
                      Review Flags
                    </Button>
                  </Link>
                  <Link href="/admin/analytics">
                    <Button variant="outline" className="w-full justify-start hover:bg-purple/5 hover:border-purple transition-all">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Tools Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Moderation */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red/10 rounded-lg">
                  <Flag className="h-5 w-5 text-red" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-inter">Moderation</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm font-inter">
                Review and moderate flagged content to maintain platform quality.
              </p>
              <Link href="/admin/flags">
                <Button className="w-full bg-red hover:bg-red/90 text-white">
                  <Flag className="h-4 w-4 mr-2" />
                  Flagged Content
                </Button>
              </Link>
            </div>

            {/* User Management */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald/10 rounded-lg">
                  <Users className="h-5 w-5 text-emerald" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-inter">User Management</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm font-inter">
                Manage user accounts, permissions, and roles across the platform.
              </p>
              <Link href="/admin/users">
                <Button className="w-full bg-emerald hover:bg-emerald/90 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            </div>

            {/* Analytics */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-inter">Analytics</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm font-inter">
                View comprehensive platform analytics and performance insights.
              </p>
              <Link href="/admin/analytics">
                <Button className="w-full bg-purple hover:bg-purple/90 text-white">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Platform Analytics
                </Button>
              </Link>
            </div>
          </div>

          {/* Additional Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Deleted Content */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <Trash2 className="h-5 w-5 text-orange" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-inter">Deleted Content</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm font-inter">
                Restore or permanently delete soft deleted content from the platform.
              </p>
              <Link href="/admin/deleted-content">
                <Button variant="outline" className="w-full border-orange text-orange hover:bg-orange/5">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deleted Content
                </Button>
              </Link>
            </div>

            {/* System Settings */}
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue/10 rounded-lg">
                  <Settings className="h-5 w-5 text-blue" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-inter">System Settings</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm font-inter">
                Configure platform settings, permissions, and system preferences.
              </p>
              <Button variant="outline" className="w-full border-blue text-blue hover:bg-blue/5" disabled>
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald/10 rounded-lg">
                <Activity className="h-5 w-5 text-emerald" />
              </div>
              <h3 className="text-xl font-bold text-foreground font-inter">Recent Activity</h3>
            </div>
            <div className="text-center py-12">
              <div className="p-4 bg-muted/50 rounded-2xl inline-block mb-4">
                <Activity className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-inter mb-2">No recent activity to display</p>
              <p className="text-sm text-muted-foreground font-inter">Activity monitoring and real-time updates coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 