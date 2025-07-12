"use client";
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  Award, 
  Zap,
  Crown,
  Target,
  Flame
} from 'lucide-react';

interface LeaderboardUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  reputation: number;
  answers: number;
  questions: number;
  periodReputation: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?range=${timeRange}`)
      .then(res => res.json())
      .then(data => {
        const leaderboard = data.leaderboard || [];
        setUsers(leaderboard);
        if (session?.user) {
          const idx = leaderboard.findIndex((u: LeaderboardUser) => u.email === session.user.email);
          if (idx !== -1) {
            setCurrentUser(leaderboard[idx]);
            setUserRank(idx + 1);
          } else {
            setCurrentUser(null);
            setUserRank(null);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [session, timeRange]);

  function getRowClass(i: number, user: LeaderboardUser) {
    if (session?.user && user.email === session.user.email) {
      return 'ring-2 ring-blue shadow-lg bg-blue/5 border-blue/20';
    }
    if (i === 0) return 'bg-gradient-to-r from-yellow/10 to-orange/10 border-yellow/20 shadow-lg';
    if (i === 1) return 'bg-gradient-to-r from-gray/10 to-slate/10 border-gray/20 shadow-lg';
    if (i === 2) return 'bg-gradient-to-r from-orange/10 to-red/10 border-orange/20 shadow-lg';
    return '';
  }

  function getRankIcon(i: number) {
    if (i === 0) return <Crown className="h-8 w-8 text-yellow-500" />;
    if (i === 1) return <Trophy className="h-8 w-8 text-gray-500" />;
    if (i === 2) return <Medal className="h-8 w-8 text-orange-500" />;
    return null;
  }

  function getBadge(user: LeaderboardUser, rank: number) {
    if (rank === 1) return { icon: <Crown className="h-4 w-4" />, text: "Champion", color: "text-yellow-500 bg-yellow/10" };
    if (rank === 2) return { icon: <Trophy className="h-4 w-4" />, text: "Elite", color: "text-gray-500 bg-gray/10" };
    if (rank === 3) return { icon: <Medal className="h-4 w-4" />, text: "Expert", color: "text-orange-500 bg-orange/10" };
    if (user.reputation >= 1000) return { icon: <Star className="h-4 w-4" />, text: "Master", color: "text-purple-500 bg-purple/10" };
    if (user.reputation >= 500) return { icon: <Award className="h-4 w-4" />, text: "Pro", color: "text-blue-500 bg-blue/10" };
    if (user.answers >= 50) return { icon: <Zap className="h-4 w-4" />, text: "Helper", color: "text-emerald-500 bg-emerald/10" };
    return { icon: <Target className="h-4 w-4" />, text: "Newcomer", color: "text-muted-foreground bg-muted" };
  }

  function getReputationColor(reputation: number) {
    if (reputation >= 1000) return 'text-purple-500';
    if (reputation >= 500) return 'text-blue-500';
    if (reputation >= 100) return 'text-emerald-500';
    if (reputation >= 50) return 'text-orange-500';
    return 'text-muted-foreground';
  }

  function renderPodiumCard(user: LeaderboardUser, rank: number, position: 'left' | 'center' | 'right') {
    const isCurrentUser = session?.user && user.email === session.user.email;
    const badge = getBadge(user, rank);

  return (
      <div className={`relative group transition-all duration-300 hover:scale-105 ${
        position === 'center' ? 'order-1' : position === 'left' ? 'order-2' : 'order-3'
      }`}>
        {/* Podium Base */}
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-4 rounded-t-2xl ${
          rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
          rank === 2 ? 'bg-gradient-to-r from-gray-400 to-slate-400' :
          'bg-gradient-to-r from-orange-400 to-red-400'
        }`}></div>
        
        {/* User Card */}
        <div className={`relative bg-card border border-border rounded-2xl shadow-lg p-6 mb-4 ${
          isCurrentUser ? 'ring-2 ring-blue shadow-xl' : ''
        } ${
          rank === 1 ? 'bg-gradient-to-br from-yellow/5 to-orange/5 border-yellow/200' :
          rank === 2 ? 'bg-gradient-to-br from-gray/5 to-slate/5 border-gray/200' :
          'bg-gradient-to-br from-orange/5 to-red/5 border-orange/200'
        }`}>
          {/* Rank Badge */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
              rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
              rank === 2 ? 'bg-gradient-to-r from-gray-400 to-slate-400' :
              'bg-gradient-to-r from-orange-400 to-red-400'
            }`}>
              {getRankIcon(rank - 1)}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center pt-6">
            <Link href={`/profile/${user._id}`} className="block hover:opacity-80 transition-opacity">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name} 
                  className={`w-20 h-20 rounded-full border-4 mx-auto mb-3 shadow-lg ${
                    rank === 1 ? 'border-yellow-400' :
                    rank === 2 ? 'border-gray-400' :
                    'border-orange-400'
                  }`} 
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-3 border-4 shadow-lg ${
                  rank === 1 ? 'bg-yellow/10 text-yellow-600 border-yellow-400' :
                  rank === 2 ? 'bg-gray/10 text-gray-600 border-gray-400' :
                  'bg-orange/10 text-orange-600 border-orange-400'
                }`}>
                  {user.name[0]}
                </div>
              )}
            </Link>
            
            <h3 className="font-bold text-lg text-foreground mb-1">{user.name}</h3>
            <div className="text-sm text-muted-foreground mb-3">@{user.email.split('@')[0]}</div>
            
            {/* Badge */}
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 ${badge.color}`}>
              {badge.icon}
              {badge.text}
            </div>
            
            {/* Stats */}
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getReputationColor(user.reputation)}`}>
                {user.reputation.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Reputation</div>
              
              <div className="flex justify-center gap-4 text-sm">
                <div>
                  <div className="font-semibold text-emerald">{user.answers}</div>
                  <div className="text-muted-foreground">Answers</div>
                </div>
                <div>
                  <div className="font-semibold text-purple">{user.questions}</div>
                  <div className="text-muted-foreground">Questions</div>
                </div>
              </div>
            </div>
          </div>
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
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-yellow-500" />
              <h1 className="text-4xl font-bold text-foreground font-inter">Leaderboard</h1>
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
            <p className="text-muted-foreground text-lg font-inter">
              Compete with the best developers and climb the ranks
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-card border border-border rounded-2xl p-2 shadow-md">
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Time', icon: <TrendingUp className="h-4 w-4" /> },
                  { value: 'month', label: 'This Month', icon: <Flame className="h-4 w-4" /> },
                  { value: 'week', label: 'This Week', icon: <Zap className="h-4 w-4" /> }
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setTimeRange(value as 'all' | 'week' | 'month')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-inter transition-all ${
                      timeRange === value
                        ? 'bg-blue text-white shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current User Card */}
          {session?.user && currentUser && userRank && (
            <div className="mb-8">
              <div className="bg-card border border-border rounded-2xl shadow-lg p-6 font-inter">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {currentUser.image ? (
                      <img 
                        src={currentUser.image} 
                        alt={currentUser.name} 
                        className="w-16 h-16 rounded-full border-2 border-blue shadow-lg" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-2xl border-2 border-blue shadow-lg">
                        {currentUser.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{currentUser.name}</h2>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getBadge(currentUser, userRank).color}`}>
                          {getBadge(currentUser, userRank).icon}
                          {getBadge(currentUser, userRank).text}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Rank: <span className="font-bold text-blue">#{userRank}</span></span>
                        <span>Reputation: <span className={`font-bold ${getReputationColor(currentUser.reputation)}`}>{currentUser.reputation}</span></span>
                        <span>Answers: <span className="font-bold text-emerald">{currentUser.answers}</span></span>
                        <span>Questions: <span className="font-bold text-purple">{currentUser.questions}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue">#{userRank}</div>
                    <div className="text-sm text-muted-foreground">Your Rank</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Podium Section */}
          {!loading && users.length >= 3 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8 font-inter">🏆 Top Performers</h2>
              <div className="flex justify-center items-end gap-4 max-w-4xl mx-auto">
                {/* 2nd Place */}
                {renderPodiumCard(users[1], 2, 'left')}
                
                {/* 1st Place */}
                {renderPodiumCard(users[0], 1, 'center')}
                
                {/* 3rd Place */}
                {renderPodiumCard(users[2], 3, 'right')}
            </div>
          </div>
        )}

          {/* Leaderboard Table */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
                <p className="text-muted-foreground font-inter">Loading leaderboard...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-inter">No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider font-inter">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider font-inter">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider font-inter">Reputation</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider font-inter">Answers</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider font-inter">Questions</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider font-inter">Badge</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user, i) => {
                      const badge = getBadge(user, i + 1);
                      return (
                    <tr
                      key={user._id}
                          className={`${getRowClass(i, user)} hover:bg-muted/30 transition-all duration-200 group`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              {getRankIcon(i) || (
                                <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                              )}
                            </div>
                      </td>
                          <td className="px-6 py-4">
                            <Link href={`/profile/${user._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          {user.image ? (
                                <img 
                                  src={user.image} 
                                  alt={user.name} 
                                  className={`w-12 h-12 rounded-full border-2 shadow-md ${
                                    i === 0 ? 'border-yellow-400' : 
                                    i === 1 ? 'border-gray-400' : 
                                    i === 2 ? 'border-orange-400' : 
                                    'border-border'
                                  }`} 
                                />
                              ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 shadow-md ${
                                  i === 0 ? 'bg-yellow/10 text-yellow-600 border-yellow-400' : 
                                  i === 1 ? 'bg-gray/10 text-gray-600 border-gray-400' : 
                                  i === 2 ? 'bg-orange/10 text-orange-600 border-orange-400' : 
                                  'bg-muted text-muted-foreground border-border'
                                }`}>
                                  {user.name[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-foreground">{user.name}</div>
                                <div className="text-sm text-muted-foreground">@{user.email.split('@')[0]}</div>
                              </div>
                        </Link>
                      </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold text-lg ${getReputationColor(user.reputation)}`}>
                              {user.reputation.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-emerald font-semibold">{user.answers}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-purple font-semibold">{user.questions}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.icon}
                              {badge.text}
                            </span>
                          </td>
                    </tr>
                      );
                    })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Gamification Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground font-inter">{users[0]?.reputation || 0}</div>
              <div className="text-muted-foreground font-inter">Top Reputation</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Users className="h-8 w-8 text-blue mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground font-inter">{users.length}</div>
              <div className="text-muted-foreground font-inter">Active Users</div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Zap className="h-8 w-8 text-emerald mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground font-inter">
                {users.reduce((sum, user) => sum + user.answers, 0)}
              </div>
              <div className="text-muted-foreground font-inter">Total Answers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 