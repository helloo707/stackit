'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MessageSquare,
  Eye,
  Loader2,
  X,
  AlertCircle,
  Trash2,
  Filter,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  User,
  Shield,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Answer {
  _id: string;
  content: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  question: {
    _id: string;
    title: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  isAccepted: boolean;
  isDeleted: boolean;
  createdAt: string;
}

interface AnswersResponse {
  answers: Answer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminAnswersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>([]);
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
  const [deletingAnswer, setDeletingAnswer] = useState<string | null>(null);

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

  const fetchAnswers = async () => {
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

      const response = await fetch(`/api/admin/answers?${params}`);
      if (response.ok) {
        const data: AnswersResponse = await response.json();
        setAnswers(data.answers);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch answers');
        setError('Failed to fetch answers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteAnswer = async (answerId: string) => {
    if (!confirm('Are you sure you want to soft delete this answer? This will hide it from users but it can be restored later.')) {
      return;
    }

    setDeletingAnswer(answerId);

    try {
      const response = await fetch(`/api/answers/${answerId}/soft-delete`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Answer soft deleted successfully');
        fetchAnswers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to soft delete answer');
      }
    } catch (error) {
      toast.error('An error occurred while soft deleting the answer');
    } finally {
      setDeletingAnswer(null);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [page, filter, sort, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVoteCount = (votes: { upvotes: string[]; downvotes: string[] }) => {
    return votes.upvotes.length - votes.downvotes.length;
  };

  if (loading && answers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading answers...</div>
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
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Answers Management</h1>
          </div>
          <p className="text-gray-600">
            Manage all answers on the platform. You can view, search, and soft delete answers as needed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Answers</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Active Answers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {answers.filter(a => !a.isDeleted).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Most Voted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {answers.length > 0 ? Math.max(...answers.map(a => getVoteCount(a.votes))) : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">This Page</p>
                <p className="text-2xl font-bold text-gray-900">{answers.length}</p>
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
                placeholder="Search answers by content..."
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
                <option value="all">All Answers</option>
                <option value="accepted">Accepted Answers</option>
                <option value="not-accepted">Not Accepted</option>
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
                <option value="votes">Most Voted</option>
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

        {/* Answers List */}
        {answers.length > 0 ? (
          <div className="space-y-4">
            {answers.map((answer) => (
              <div key={answer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Vote Count */}
                      <div className="flex flex-col items-center gap-1 min-w-[40px]">
                        <ThumbsUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {getVoteCount(answer.votes)}
                        </span>
                        <ThumbsDown className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* Answer Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">Answer to:</span>
                          <Link 
                            href={`/questions/${answer.question._id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {answer.question.title}
                          </Link>
                          {answer.isDeleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Deleted
                            </span>
                          )}
                          {answer.isAccepted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepted
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {answer.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>
                        
                        {/* Meta Information */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{answer.author.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(answer.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Link href={`/questions/${answer.question._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    
                    {!answer.isDeleted && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSoftDeleteAnswer(answer._id)}
                        disabled={deletingAnswer === answer._id}
                        className="flex items-center gap-2"
                      >
                        {deletingAnswer === answer._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {deletingAnswer === answer._id ? 'Deleting...' : 'Soft Delete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No answers found.</p>
            <p className="text-gray-500 text-sm">
              {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'No answers have been created yet.'}
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
    </div>
  );
} 