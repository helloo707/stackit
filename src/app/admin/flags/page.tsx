'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  Flag, 
  Eye, 
  Trash2, 
  User,
  Calendar,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FlaggedContent {
  _id: string;
  contentType: 'question' | 'answer';
  contentId: {
    _id: string;
    title?: string;
    content: string;
    author: {
      name: string;
      email: string;
      image?: string;
    };
    tags?: string[];
    question?: {
      _id: string;
      title: string;
    };
  };
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reporter: {
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
}

interface FlagsResponse {
  flags: FlaggedContent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminFlagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flags, setFlags] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'question' | 'answer'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

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

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        type: contentTypeFilter,
      });

      const response = await fetch(`/api/flags?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch flagged content');
      }

      const data: FlagsResponse = await response.json();
      setFlags(data.flags);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (flagId: string, action: string, status: string) => {
    try {
      const response = await fetch(`/api/flags/${flagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, status }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Flag ${action} successfully`);
        fetchFlags(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to moderate flag');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [currentPage, statusFilter, contentTypeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-red-100 text-red-800',
      inappropriate: 'bg-orange-100 text-orange-800',
      offensive: 'bg-red-100 text-red-800',
      duplicate: 'bg-yellow-100 text-yellow-800',
      misleading: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && flags.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading flagged content...</div>
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
            <Flag className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Flagged Content Management</h1>
          </div>
          <p className="text-gray-600">
            Review and moderate flagged questions and answers. Take appropriate action to maintain community standards.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Pending Flags</p>
                <p className="text-2xl font-bold text-gray-900">
                  {flags.filter(f => f.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {flags.filter(f => f.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Dismissed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {flags.filter(f => f.status === 'dismissed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Content</option>
                <option value="question">Questions Only</option>
                <option value="answer">Answers Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Flagged Content */}
        {flags.length > 0 ? (
          <div className="space-y-6">
            {flags.map((flag) => (
              <div key={flag._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Content Type and Status */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flag.status)}`}>
                        {flag.status}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {flag.contentType}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(flag.reason)}`}>
                        {flag.reason}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      {flag.contentType === 'question' ? (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {flag.contentId.title}
                          </h3>
                          <p className="text-gray-600 mb-2 line-clamp-2">
                            {flag.contentId.content}
                          </p>
                          {flag.contentId.tags && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {flag.contentId.tags.map((tag) => (
                                <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="mb-2">
                            <span className="text-sm text-gray-500">Answer to: </span>
                            <span className="text-sm font-medium text-blue-600">
                              {flag.contentId.question?.title}
                            </span>
                          </div>
                          <p className="text-gray-600 line-clamp-2">
                            {flag.contentId.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Author: {flag.contentId.author.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Reporter: {flag.reporter.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Flagged: {formatDate(flag.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {flag.status === 'pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModeration(flag._id, 'dismiss', 'dismissed')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModeration(flag._id, 'resolve', 'resolved')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleModeration(flag._id, 'soft-delete', 'resolved')}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Content
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No flagged content found.</p>
            <p className="text-gray-500 text-sm">All content is currently clean.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
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
                    onClick={() => setCurrentPage(pagination.pages)}
                  >
                    {pagination.pages}
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === pagination.pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 