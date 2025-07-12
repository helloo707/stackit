'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  Bookmark,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Award,
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
  PieChart,
  Activity,
  Target,
  Zap,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Flag
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalQuestions: number;
    totalAnswers: number;
    totalFlags: number;
    totalBookmarks: number;
    bannedUsers: number;
    activeUsers: number;
    adminUsers: number;
    deletedQuestions: number;
    deletedAnswers: number;
    acceptedAnswers: number;
    pendingFlags: number;
  };
  recentActivity: {
    period: number;
    newUsers: number;
    newQuestions: number;
    newAnswers: number;
    newFlags: number;
    newBookmarks: number;
  };
  engagement: {
    usersWithQuestions: number;
    usersWithAnswers: number;
    usersWithBookmarks: number;
    topReputationUsers: Array<{
      name: string;
      email: string;
      reputation: number;
    }>;
  };
  contentQuality: {
    questionsWithAnswers: number;
    questionsWithoutAnswers: number;
    averageAnswersPerQuestion: number;
    averageVotesPerQuestion: number;
    averageVotesPerAnswer: number;
  };
  moderation: {
    flagReasons: Array<{
      _id: string;
      count: number;
    }>;
    flagStatuses: Array<{
      _id: string;
      count: number;
    }>;
  };
  growthTrends: Array<{
    date: string;
    users: number;
    questions: number;
    answers: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

export default function AdminAnalyticsPage() {
  // All hooks must be called first, before any conditional logic
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChart, setSelectedChart] = useState('overview');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      
      if (response.ok) {
        const data: AnalyticsData = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to fetch analytics');
        setError('Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  useEffect(() => {
    // Only fetch analytics if user is authenticated and is admin
    if (session?.user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [period, session]);

  // Handle authentication and authorization after all hooks
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <Navigation />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-300">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  // Check if user is admin
  if (session.user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const prepareChartData = () => {
    if (!analytics) return {};

    // Overview stats for bar chart
    const overviewData = [
      { name: 'Users', value: analytics.overview.totalUsers, color: '#0088FE' },
      { name: 'Questions', value: analytics.overview.totalQuestions, color: '#00C49F' },
      { name: 'Answers', value: analytics.overview.totalAnswers, color: '#FFBB28' },
      { name: 'Bookmarks', value: analytics.overview.totalBookmarks, color: '#FF8042' },
    ];

    // Flag reasons for pie chart
    const flagReasonsData = analytics.moderation.flagReasons.map((reason, index) => ({
      name: reason._id.charAt(0).toUpperCase() + reason._id.slice(1),
      value: reason.count,
      color: COLORS[index % COLORS.length]
    }));

    // Content quality radar data
    const contentQualityData = [
      { metric: 'Questions with Answers', value: analytics.contentQuality.questionsWithAnswers, fullMark: analytics.overview.totalQuestions },
      { metric: 'Accepted Answers', value: analytics.overview.acceptedAnswers, fullMark: analytics.overview.totalAnswers },
      { metric: 'Avg Answers/Question', value: analytics.contentQuality.averageAnswersPerQuestion * 10, fullMark: 50 },
      { metric: 'Avg Votes/Question', value: analytics.contentQuality.averageVotesPerQuestion * 5, fullMark: 50 },
      { metric: 'Avg Votes/Answer', value: analytics.contentQuality.averageVotesPerAnswer * 5, fullMark: 50 },
    ];

    // User engagement data
    const engagementData = [
      { name: 'Active Users', value: analytics.overview.activeUsers, percentage: formatPercentage(analytics.overview.activeUsers, analytics.overview.totalUsers) },
      { name: 'Banned Users', value: analytics.overview.bannedUsers, percentage: formatPercentage(analytics.overview.bannedUsers, analytics.overview.totalUsers) },
      { name: 'Admin Users', value: analytics.overview.adminUsers, percentage: formatPercentage(analytics.overview.adminUsers, analytics.overview.totalUsers) },
    ];

    return {
      overviewData,
      flagReasonsData,
      contentQualityData,
      engagementData
    };
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <Navigation />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-300">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      <Navigation />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-['Orbitron']">Platform Analytics</h1>
                <p className="text-blue-200 text-sm">Comprehensive insights into platform usage, user engagement, and content quality.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 backdrop-blur-sm"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {analytics && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.totalUsers)}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Questions</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.totalQuestions)}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Answers</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.totalAnswers)}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Flags</p>
                    <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.totalFlags)}</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <Flag className="h-6 w-6 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Growth Trends Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Growth Trends</h3>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.growthTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="questions" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="answers" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Flag Reasons Pie Chart */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Flag Reasons</h3>
                  <PieChart className="h-5 w-5 text-purple-400" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.flagReasonsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.flagReasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">User Engagement</h3>
                  <Activity className="h-5 w-5 text-blue-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Active Users</span>
                    <span className="text-white font-semibold">{formatNumber(analytics.overview.activeUsers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Banned Users</span>
                    <span className="text-red-400 font-semibold">{formatNumber(analytics.overview.bannedUsers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Admin Users</span>
                    <span className="text-purple-400 font-semibold">{formatNumber(analytics.overview.adminUsers)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Content Quality</h3>
                  <Target className="h-5 w-5 text-green-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Questions with Answers</span>
                    <span className="text-white font-semibold">{formatNumber(analytics.contentQuality.questionsWithAnswers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Accepted Answers</span>
                    <span className="text-green-400 font-semibold">{formatNumber(analytics.overview.acceptedAnswers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Avg Answers/Question</span>
                    <span className="text-white font-semibold">{analytics.contentQuality.averageAnswersPerQuestion.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Moderation</h3>
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pending Flags</span>
                    <span className="text-yellow-400 font-semibold">{formatNumber(analytics.overview.pendingFlags)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Deleted Questions</span>
                    <span className="text-red-400 font-semibold">{formatNumber(analytics.overview.deletedQuestions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Deleted Answers</span>
                    <span className="text-red-400 font-semibold">{formatNumber(analytics.overview.deletedAnswers)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Top Reputation Users</h3>
                <Award className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.engagement.topReputationUsers.slice(0, 6).map((user, index) => (
                  <div key={user.email} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">#{index + 1}</span>
                      <span className="text-yellow-400 font-semibold">{formatNumber(user.reputation)}</span>
                    </div>
                    <p className="text-white font-medium truncate">{user.name}</p>
                    <p className="text-slate-400 text-sm truncate">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 