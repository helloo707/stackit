'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Users,
  Eye,
  Loader2,
  X,
  AlertCircle,
  Ban,
  UserCheck,
  Filter,
  Calendar,
  Shield,
  User,
  Mail,
  Award,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: 'guest' | 'user' | 'admin';
  reputation: number;
  isBanned: boolean;
  bannedAt?: string;
  banReason?: string;
  bannedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [banningUser, setBanningUser] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort,
        filter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch users');
        setError('Failed to fetch users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (user: User) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const confirmBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error('Please provide a ban reason');
      return;
    }

    setBanningUser(selectedUser._id);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: 'ban',
          reason: banReason.trim(),
        }),
      });

      if (response.ok) {
        toast.success('User banned successfully');
        setShowBanModal(false);
        setSelectedUser(null);
        setBanReason('');
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to ban user');
      }
    } catch (error) {
      toast.error('An error occurred while banning the user');
    } finally {
      setBanningUser(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) {
      return;
    }

    setBanningUser(userId);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'unban',
        }),
      });

      if (response.ok) {
        toast.success('User unbanned successfully');
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to unban user');
      }
    } catch (error) {
      toast.error('An error occurred while unbanning the user');
    } finally {
      setBanningUser(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, filter, sort, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      user: 'bg-blue-100 text-blue-800',
      guest: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>
          <p className="text-gray-600">
            Manage all users on the platform. You can view, search, and ban/unban users as needed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => !u.isBanned).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Banned Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isBanned).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="banned">Banned Users</option>
                <option value="admin">Admins</option>
                <option value="user">Regular Users</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="email">Email A-Z</option>
                <option value="reputation">Highest Reputation</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                  setSort('newest');
                  setPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Users List */}
        {users.length > 0 ? (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          {user.isBanned && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Banned
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            <span>{user.reputation} reputation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {formatDate(user.createdAt)}</span>
                          </div>
                        </div>

                        {/* Ban Info */}
                        {user.isBanned && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 text-sm text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">Banned on {formatDate(user.bannedAt!)}</span>
                            </div>
                            {user.banReason && (
                              <p className="text-sm text-red-700 mt-1">Reason: {user.banReason}</p>
                            )}
                            {user.bannedBy && (
                              <p className="text-sm text-red-700">Banned by: {user.bannedBy.name}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    {!user.isBanned && user.role !== 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBanUser(user)}
                        disabled={banningUser === user._id}
                        className="flex items-center gap-2"
                      >
                        {banningUser === user._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                        {banningUser === user._id ? 'Banning...' : 'Ban User'}
                      </Button>
                    )}
                    
                    {user.isBanned && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user._id)}
                        disabled={banningUser === user._id}
                        className="flex items-center gap-2"
                      >
                        {banningUser === user._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                        {banningUser === user._id ? 'Unbanning...' : 'Unban User'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No users found.</p>
            <p className="text-gray-500 text-sm">
              {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'No users have been created yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {pagination.pages > 5 && (
                <>
                  <span className="text-gray-500">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.pages)}
                  >
                    {pagination.pages}
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ban User: {selectedUser.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for banning this user. This action will prevent them from accessing the platform.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBanUser}
                disabled={!banReason.trim() || banningUser === selectedUser._id}
              >
                {banningUser === selectedUser._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Banning...
                  </>
                ) : (
                  'Ban User'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 