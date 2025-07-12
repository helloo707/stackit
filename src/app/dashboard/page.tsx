'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Calendar, 
  Award, 
  Bookmark, 
  MessageSquare, 
  ThumbsUp, 
  Eye,
  Edit,
  Settings,
  Plus,
  Search,
  TrendingUp,
  Activity,
  Clock,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface UserStats {
  questionsAsked: number;
  answersGiven: number;
  totalVotes: number;
  totalViews: number;
  bookmarksCount: number;
  reputation: number;
}

interface RecentActivity {
  _id: string;
  type: 'question' | 'answer' | 'vote' | 'bookmark';
  title: string;
  content?: string;
  createdAt: string;
  votes?: number;
  views?: number;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Redirect admin users to admin dashboard
    if (session.user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.user);
      }

      // Fetch user stats
      const statsResponse = await fetch('/api/user/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData.stats);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/user/activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activity);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {userProfile?.name || session.user?.name}!</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {userProfile?.image ? (
                  <img 
                    src={userProfile.image} 
                    alt={userProfile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{userProfile?.name}</h3>
                <p className="text-gray-600">{userProfile?.email}</p>
                <div className="flex items-center mt-1">
                  <Award className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-gray-600">{userProfile?.role}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <span>{userProfile?.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Member since {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Award className="h-4 w-4 mr-2" />
                <span>{userStats?.reputation || 0} reputation points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions Asked</p>
                <p className="text-2xl font-bold text-gray-900">{userStats?.questionsAsked || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Answers Given</p>
                <p className="text-2xl font-bold text-gray-900">{userStats?.answersGiven || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{userStats?.totalVotes || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bookmarks</p>
                <p className="text-2xl font-bold text-gray-900">{userStats?.bookmarksCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <Link href="/user/activity">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                  <Link href="/questions/ask">
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Ask Your First Question
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.type === 'question' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'answer' && <MessageSquare className="h-4 w-4 text-green-600" />}
                        {activity.type === 'vote' && <ThumbsUp className="h-4 w-4 text-purple-600" />}
                        {activity.type === 'bookmark' && <Bookmark className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        {activity.content && (
                          <p className="text-sm text-gray-600 truncate">{activity.content}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                          {activity.votes !== undefined && (
                            <span className="text-xs text-gray-500">
                              <ThumbsUp className="h-3 w-3 inline mr-1" />
                              {activity.votes} votes
                            </span>
                          )}
                          {activity.views !== undefined && (
                            <span className="text-xs text-gray-500">
                              <Eye className="h-3 w-3 inline mr-1" />
                              {activity.views} views
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/questions/ask">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
                </Link>
                <Link href="/questions">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Questions
                  </Button>
                </Link>
                <Link href="/bookmarks">
                  <Button variant="outline" className="w-full justify-start">
                    <Bookmark className="h-4 w-4 mr-2" />
                    My Bookmarks
                  </Button>
                </Link>
                <Link href="/user/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                </Link>
              </div>
            </div>

            {/* Reputation Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {userStats?.reputation || 0}
                </div>
                <p className="text-sm text-gray-600 mb-4">reputation points</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((userStats?.reputation || 0) / 100 * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {userStats?.reputation || 0} / 100 points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 