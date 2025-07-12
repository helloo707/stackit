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
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto"></div>
            <p className="mt-4 text-muted-foreground font-inter">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
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
            <h1 className="text-3xl font-bold text-foreground font-inter">Dashboard</h1>
            <p className="text-muted-foreground mt-2 font-inter">Welcome back, {userProfile?.name || session.user?.name}!</p>
          </div>

          {/* User Profile Card */}
          <div className="bg-card rounded-2xl shadow-md border border-border p-6 mb-8 font-inter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground font-inter">Profile Information</h2>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue/10 rounded-full flex items-center justify-center">
                  {userProfile?.image ? (
                    <img 
                      src={userProfile.image} 
                      alt={userProfile.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-blue" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground font-inter">{userProfile?.name}</h3>
                  <p className="text-muted-foreground font-inter">{userProfile?.email}</p>
                  <div className="flex items-center mt-1">
                    <Award className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-muted-foreground font-inter">{userProfile?.role}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-muted-foreground font-inter">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{userProfile?.email}</span>
                </div>
                <div className="flex items-center text-muted-foreground font-inter">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Member since {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'N/A'}</span>
                </div>
                <div className="flex items-center text-muted-foreground font-inter">
                  <Award className="h-4 w-4 mr-2" />
                  <span>{userStats?.reputation || 0} reputation points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground font-inter">Questions Asked</p>
                  <p className="text-2xl font-bold text-foreground font-inter">{userStats?.questionsAsked || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-emerald" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground font-inter">Answers Given</p>
                  <p className="text-2xl font-bold text-foreground font-inter">{userStats?.answersGiven || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <ThumbsUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground font-inter">Total Votes</p>
                  <p className="text-2xl font-bold text-foreground font-inter">{userStats?.totalVotes || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange/10 rounded-lg flex items-center justify-center">
                  <Bookmark className="h-6 w-6 text-orange" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground font-inter">Bookmarks</p>
                  <p className="text-2xl font-bold text-foreground font-inter">{userStats?.bookmarksCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground font-inter">Recent Activity</h2>
                  <Link href="/user/activity">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-inter">No recent activity</p>
                    <Link href="/questions/ask">
                      <Button className="mt-4 font-inter">
                        <Plus className="h-4 w-4 mr-2" />
                        Ask Your First Question
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity._id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted transition-colors font-inter">
                        <div className="w-8 h-8 bg-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                          {activity.type === 'question' && <MessageSquare className="h-4 w-4 text-blue" />}
                          {activity.type === 'answer' && <MessageSquare className="h-4 w-4 text-emerald" />}
                          {activity.type === 'vote' && <ThumbsUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                          {activity.type === 'bookmark' && <Bookmark className="h-4 w-4 text-orange" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate font-inter">
                            {activity.title}
                          </p>
                          {activity.content && (
                            <p className="text-sm text-muted-foreground truncate font-inter">{activity.content}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground font-inter">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatRelativeTime(activity.createdAt)}
                            </span>
                            {activity.votes !== undefined && (
                              <span className="text-xs text-muted-foreground font-inter">
                                <ThumbsUp className="h-3 w-3 inline mr-1" />
                                {activity.votes} votes
                              </span>
                            )}
                            {activity.views !== undefined && (
                              <span className="text-xs text-muted-foreground font-inter">
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
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <Link href="/questions/ask">
                    <Button className="w-full justify-start gap-2 font-inter font-medium rounded-xl transition-all">
                      <Plus className="h-4 w-4" />
                      Ask a Question
                    </Button>
                  </Link>
                  <Link href="/questions">
                    <Button variant="outline" className="w-full justify-start gap-2 font-inter font-medium rounded-xl hover:bg-muted transition-all">
                      <Search className="h-4 w-4" />
                      Browse Questions
                    </Button>
                  </Link>
                  <Link href="/bookmarks">
                    <Button variant="outline" className="w-full justify-start gap-2 font-inter font-medium rounded-xl hover:bg-muted transition-all">
                      <Bookmark className="h-4 w-4" />
                      My Bookmarks
                    </Button>
                  </Link>
                  <Link href="/user/profile">
                    <Button variant="outline" className="w-full justify-start gap-2 font-inter font-medium rounded-xl hover:bg-muted transition-all">
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Reputation Progress */}
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Reputation</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue mb-2 font-inter">
                    {userStats?.reputation || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 font-inter">reputation points</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((userStats?.reputation || 0) / 100 * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-inter">
                    {userStats?.reputation || 0} / 100 points
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 