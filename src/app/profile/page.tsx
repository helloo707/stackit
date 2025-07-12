'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Mail, 
  Award, 
  Edit, 
  Save, 
  X,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

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

interface FollowedQuestion {
  _id: string;
  title: string;
  createdAt?: string;
}

interface ReputationChange {
  change: number;
  reason: string;
  relatedQuestion?: string;
  relatedAnswer?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [followedQuestions, setFollowedQuestions] = useState<FollowedQuestion[]>([]);
  const [loadingFollows, setLoadingFollows] = useState(true);
  const [reputationHistory, setReputationHistory] = useState<ReputationChange[]>([]);
  const [loadingReputation, setLoadingReputation] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchUserProfile();
    fetchFollowedQuestions();
    fetchReputationHistory();
  }, [session, status]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedQuestions = async () => {
    try {
      setLoadingFollows(true);
      const res = await fetch('/api/questions/followed');
      if (res.ok) {
        const data = await res.json();
        setFollowedQuestions(data.questions || []);
      } else {
        setFollowedQuestions([]);
      }
    } catch {
      setFollowedQuestions([]);
    } finally {
      setLoadingFollows(false);
    }
  };

  const fetchReputationHistory = async () => {
    try {
      setLoadingReputation(true);
      const res = await fetch('/api/user/reputation');
      if (res.ok) {
        const data = await res.json();
        setReputationHistory(data.reputationHistory || []);
      } else {
        setReputationHistory([]);
      }
    } catch {
      setReputationHistory([]);
    } finally {
      setLoadingReputation(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setEditing(false);
        toast.success('Profile updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      email: userProfile?.email || '',
    });
    setEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto"></div>
            <p className="mt-4 text-muted-foreground font-inter">Loading profile...</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <User className="h-14 w-14 text-blue" />
                )}
                {editing && (
                  <button className="absolute bottom-1 right-1 w-8 h-8 bg-blue rounded-full flex items-center justify-center text-white hover:bg-blue-dark">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1 font-inter">{editing ? formData.name : userProfile?.name}</h2>
            <p className="text-muted-foreground font-inter mb-1">{userProfile?.email}</p>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground font-inter">{userProfile?.role}</span>
              <span className="text-xs text-muted-foreground font-inter">•</span>
              <span className="text-sm text-blue font-inter">{userProfile?.reputation || 0} reputation</span>
            </div>
            <div>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            {/* Followed Questions Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Followed Questions</h2>
              {loadingFollows ? (
                <div className="text-gray-500">Loading followed questions...</div>
              ) : followedQuestions.length === 0 ? (
                <div className="text-gray-500">You are not following any questions yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {followedQuestions.map((q) => (
                    <li key={q._id} className="py-3">
                      <Link href={`/questions/${q._id}`} className="text-blue-600 hover:underline font-medium">
                        {q.title}
                      </Link>
                      <span className="ml-2 text-xs text-gray-400">{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Reputation History Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reputation History</h2>
              {loadingReputation ? (
                <div className="text-gray-500">Loading reputation history...</div>
              ) : reputationHistory.length === 0 ? (
                <div className="text-gray-500">No reputation changes yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {reputationHistory.map((r, i) => (
                    <li key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <span className={r.change > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {r.change > 0 ? '+' : ''}{r.change}
                        </span>
                        <span className="ml-2 text-gray-800">{r.reason}</span>
                        {r.relatedQuestion && (
                          <Link href={`/questions/${r.relatedQuestion}`} className="ml-2 text-blue-600 hover:underline text-xs">[question]</Link>
                        )}
                        {r.relatedAnswer && (
                          <Link href={`/questions/${r.relatedQuestion}#answer-${r.relatedAnswer}`} className="ml-2 text-blue-600 hover:underline text-xs">[answer]</Link>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Details and Editable Fields */}
            <div className="flex-1 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Account Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 font-inter">Member Since</label>
                      <p className="text-foreground font-inter">{userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 font-inter">Last Updated</label>
                      <p className="text-foreground font-inter">{userProfile?.updatedAt ? formatDate(userProfile.updatedAt) : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {/* Editable Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Personal Info</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 font-inter">Full Name</label>
                      {editing ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                          className="font-inter"
                        />
                      ) : (
                        <p className="text-foreground font-inter">{userProfile?.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 font-inter">Email Address</label>
                      {editing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          className="font-inter"
                        />
                      ) : (
                        <p className="text-foreground font-inter">{userProfile?.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6 lg:w-80 mt-8 lg:mt-0">
              {/* Account Stats */}
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Account Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-inter">Reputation</span>
                    <span className="font-semibold text-foreground font-inter">{userProfile?.reputation || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-inter">Role</span>
                    <span className="font-semibold text-foreground font-inter capitalize">{userProfile?.role}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl shadow-md border border-border p-6 font-inter">
                <h3 className="text-lg font-semibold text-foreground mb-4 font-inter">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="w-full justify-start gap-2 font-inter font-medium rounded-xl hover:bg-muted transition-all">
                    <User className="h-4 w-4" />
                    View Dashboard
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 font-inter font-medium rounded-xl hover:bg-muted transition-all">
                    <Mail className="h-4 w-4" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 font-inter font-medium rounded-xl hover:bg-muted transition-all">
                    <Award className="h-4 w-4" />
                    View Achievements
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 