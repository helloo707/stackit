import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';

interface PublicUser {
  _id: string;
  name: string;
  image?: string;
  reputation: number;
  answers: number;
  questions: number;
  createdAt: string;
}

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/user/public/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else setUser(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="text-gray-500">User not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {user.image ? (
            <img src={user.image} alt={user.name} className="w-24 h-24 rounded-full mx-auto mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500 font-bold mx-auto mb-4">{user.name[0]}</div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h1>
          <div className="text-blue-700 font-semibold text-lg mb-2">Reputation: {user.reputation}</div>
          <div className="flex justify-center gap-8 text-sm text-gray-700 mb-4">
            <div><span className="font-bold">{user.answers}</span> Answers</div>
            <div><span className="font-bold">{user.questions}</span> Questions</div>
          </div>
          <div className="text-xs text-gray-500 mb-4">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}</div>
        </div>
      </div>
    </div>
  );
} 