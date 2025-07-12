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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChart, setSelectedChart] = useState('overview');

  // Redirect if not authenticated or not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
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
    fetchAnalytics();
  }, [period]);

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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            Comprehensive insights into platform usage, user engagement, and content quality.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {analytics && (
          <>
            {/* Chart Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'growth', label: 'Growth Trends', icon: TrendingUp },
                  { id: 'engagement', label: 'User Engagement', icon: Users },
                  { id: 'moderation', label: 'Moderation', icon: Shield },
                  { id: 'quality', label: 'Content Quality', icon: Target }
                ].map((chart) => (
                  <Button
                    key={chart.id}
                    variant={selectedChart === chart.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedChart(chart.id)}
                    className="flex items-center gap-2"
                  >
                    <chart.icon className="h-4 w-4" />
                    {chart.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Overview Stats with Animated Cards */}
            {selectedChart === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Users</p>
                        <p className="text-3xl font-bold">{formatNumber(analytics.overview.totalUsers)}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm">+{formatNumber(analytics.recentActivity.newUsers)} new</span>
                        </div>
                      </div>
                      <Users className="h-12 w-12 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Questions</p>
                        <p className="text-3xl font-bold">{formatNumber(analytics.overview.totalQuestions)}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm">+{formatNumber(analytics.recentActivity.newQuestions)} new</span>
                        </div>
                      </div>
                      <MessageSquare className="h-12 w-12 text-green-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Answers</p>
                        <p className="text-3xl font-bold">{formatNumber(analytics.overview.totalAnswers)}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm">+{formatNumber(analytics.recentActivity.newAnswers)} new</span>
                        </div>
                      </div>
                      <TrendingUp className="h-12 w-12 text-purple-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Total Bookmarks</p>
                        <p className="text-3xl font-bold">{formatNumber(analytics.overview.totalBookmarks)}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm">+{formatNumber(analytics.recentActivity.newBookmarks)} new</span>
                        </div>
                      </div>
                      <Bookmark className="h-12 w-12 text-orange-200" />
                    </div>
                  </div>
                </div>

                {/* Overview Bar Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Platform Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.overviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatNumber(Number(value)), 'Count']}
                        labelStyle={{ color: '#374151' }}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* User Distribution Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">User Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={chartData.engagementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.engagementData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Users']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Growth Trends */}
            {selectedChart === 'growth' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Growth Trends (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={analytics.growthTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value, name) => [formatNumber(Number(value)), name]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      <Bar dataKey="questions" fill="#82ca9d" radius={[2, 2, 0, 0]} />
                      <Line type="monotone" dataKey="answers" stroke="#ff7300" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Growth Rate Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">User Growth</p>
                        <p className="text-2xl font-bold text-blue-900">
                          +{formatNumber(analytics.recentActivity.newUsers)}
                        </p>
                        <p className="text-blue-600 text-sm">in {period} days</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Question Growth</p>
                        <p className="text-2xl font-bold text-green-900">
                          +{formatNumber(analytics.recentActivity.newQuestions)}
                        </p>
                        <p className="text-green-600 text-sm">in {period} days</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Answer Growth</p>
                        <p className="text-2xl font-bold text-purple-900">
                          +{formatNumber(analytics.recentActivity.newAnswers)}
                        </p>
                        <p className="text-purple-600 text-sm">in {period} days</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Engagement */}
            {selectedChart === 'engagement' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">User Engagement Radar</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={chartData.contentQualityData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
                      <Radar name="Engagement" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Users Leaderboard */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Users by Reputation</h3>
                  <div className="space-y-4">
                    {analytics.engagement.topReputationUsers.map((user, index) => (
                      <div key={user.email} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-yellow-500" />
                          <span className="font-bold text-green-600">{formatNumber(user.reputation)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Moderation Analytics */}
            {selectedChart === 'moderation' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Flag Reasons Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={chartData.flagReasonsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.flagReasonsData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatNumber(Number(value)), 'Flags']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Moderation Overview</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Flag className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Total Flags</p>
                            <p className="text-sm text-gray-600">Content reported by users</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-red-600">{formatNumber(analytics.overview.totalFlags)}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Pending Flags</p>
                            <p className="text-sm text-gray-600">Awaiting review</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">{formatNumber(analytics.overview.pendingFlags)}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Ban className="h-6 w-6 text-orange-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Banned Users</p>
                            <p className="text-sm text-gray-600">Suspended accounts</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-orange-600">{formatNumber(analytics.overview.bannedUsers)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Quality */}
            {selectedChart === 'quality' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Content Quality Metrics</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={[
                      {
                        metric: 'Questions with Answers',
                        value: analytics.contentQuality.questionsWithAnswers,
                        total: analytics.overview.totalQuestions,
                        percentage: formatPercentage(analytics.contentQuality.questionsWithAnswers, analytics.overview.totalQuestions)
                      },
                      {
                        metric: 'Accepted Answers',
                        value: analytics.overview.acceptedAnswers,
                        total: analytics.overview.totalAnswers,
                        percentage: formatPercentage(analytics.overview.acceptedAnswers, analytics.overview.totalAnswers)
                      },
                      {
                        metric: 'Avg Answers/Question',
                        value: analytics.contentQuality.averageAnswersPerQuestion,
                        total: 10,
                        percentage: `${(analytics.contentQuality.averageAnswersPerQuestion * 10).toFixed(1)}%`
                      },
                      {
                        metric: 'Avg Votes/Question',
                        value: analytics.contentQuality.averageVotesPerQuestion,
                        total: 10,
                        percentage: `${(analytics.contentQuality.averageVotesPerQuestion * 10).toFixed(1)}%`
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [name === 'value' ? formatNumber(Number(value)) : value, name]}
                        labelStyle={{ color: '#374151' }}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Quality Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Answer Rate</p>
                        <p className="text-2xl font-bold">
                          {formatPercentage(analytics.contentQuality.questionsWithAnswers, analytics.overview.totalQuestions)}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Acceptance Rate</p>
                        <p className="text-2xl font-bold">
                          {formatPercentage(analytics.overview.acceptedAnswers, analytics.overview.totalAnswers)}
                        </p>
                      </div>
                      <Award className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Avg Answers/Q</p>
                        <p className="text-2xl font-bold">
                          {analytics.contentQuality.averageAnswersPerQuestion.toFixed(1)}
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Engagement Score</p>
                        <p className="text-2xl font-bold">
                          {((analytics.contentQuality.averageVotesPerQuestion + analytics.contentQuality.averageVotesPerAnswer) / 2).toFixed(1)}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-orange-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 