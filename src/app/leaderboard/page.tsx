"use client";
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?range=all`)
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
  }, [session]);

  function getRowClass(i: number, user: LeaderboardUser) {
    if (session?.user && user.email === session.user.email) {
      return 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50/60 dark:bg-blue-900/40';
    }
    if (i === 0) return 'bg-yellow-100/80 dark:bg-yellow-900/40';
    if (i === 1) return 'bg-gray-200/80 dark:bg-gray-700/60';
    if (i === 2) return 'bg-orange-100/80 dark:bg-orange-900/40';
    return '';
  }

  function getRankIcon(i: number) {
    if (i === 0) return <span title="1st" className="text-2xl">🥇</span>;
    if (i === 1) return <span title="2nd" className="text-2xl">🥈</span>;
    if (i === 2) return <span title="3rd" className="text-2xl">🥉</span>;
    return null;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-blue-50 to-indigo-100 via-blue-100 to-indigo-200 dark:from-[#1a1333] dark:via-[#23235b] dark:to-[#1e2746] flex flex-col">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-12 flex-1 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-10 text-center tracking-tight drop-shadow-lg">Leaderboard</h1>
        {session?.user && currentUser && userRank && (
          <div className="mb-8 flex flex-col items-center justify-center">
            <div className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-2xl border border-blue-200 dark:border-blue-800 px-8 py-6 flex flex-col items-center gap-2 ring-1 ring-inset ring-blue-100 dark:ring-blue-900">
              <div className="flex items-center gap-4">
                {currentUser.image ? (
                  <img src={currentUser.image} alt={currentUser.name} className="w-16 h-16 rounded-full border-2 border-blue-400 dark:border-blue-500 shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-extrabold text-2xl border-2 border-blue-400 dark:border-blue-500 shadow-lg">{currentUser.name[0]}</div>
                )}
                <div>
                  <div className="font-bold text-2xl text-blue-700 dark:text-blue-300">{currentUser.name}</div>
                  <div className="text-gray-600 dark:text-gray-300 text-lg">Rank: <span className="font-bold text-blue-600 dark:text-blue-400">#{userRank}</span></div>
                  <div className="text-gray-500 dark:text-gray-400 text-base">Reputation: <span className="font-semibold text-blue-700 dark:text-blue-300">{currentUser.reputation}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="w-full overflow-x-auto">
          <div className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-0">
            {loading ? (
              <div className="text-gray-500 dark:text-gray-400 text-center text-lg py-12">Loading leaderboard...</div>
            ) : users.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center text-lg py-12">No users found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Reputation</th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Answers</th>
                    <th className="px-6 py-4 text-left text-lg font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr
                      key={user._id}
                      className={
                        `${getRowClass(i, user)} ` +
                        `${i % 2 === 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-blue-50/40 dark:bg-gray-800/40'} ` +
                        'hover:scale-[1.01] hover:shadow-lg transition-all duration-150 cursor-pointer'
                      }
                      style={{ transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s' }}
                    >
                      <td className="px-6 py-4 font-extrabold text-2xl text-center align-middle">
                        {getRankIcon(i) || <span className="text-lg font-bold text-gray-500 dark:text-gray-400">{i + 1}</span>}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-4 align-middle">
                        <Link href={`/profile/${user._id}`} className="flex items-center gap-3 hover:underline">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className={`w-12 h-12 rounded-full border-2 shadow ${i === 0 ? 'border-yellow-400 dark:border-yellow-500' : i === 1 ? 'border-gray-400 dark:border-gray-500' : i === 2 ? 'border-orange-400 dark:border-orange-500' : 'border-blue-200 dark:border-blue-700'}`} />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-2xl border-2 shadow ${i === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-500' : i === 1 ? 'bg-gray-200 text-gray-700 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500' : i === 2 ? 'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-500' : 'bg-gray-200 text-gray-500 border-blue-200 dark:bg-gray-700 dark:text-gray-300 dark:border-blue-700'}`}>{user.name[0]}</div>
                          )}
                          <span className="font-semibold text-lg text-gray-900 dark:text-white">{user.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-700 dark:text-blue-300 text-lg align-middle">{user.reputation}</td>
                      <td className="px-6 py-4 text-center text-base align-middle text-gray-700 dark:text-gray-200">{user.answers}</td>
                      <td className="px-6 py-4 text-center text-base align-middle text-gray-700 dark:text-gray-200">{user.questions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 