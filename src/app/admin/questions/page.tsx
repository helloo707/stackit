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
  Tag,
  AlertCircle,
  Trash2,
  Filter,
  SortAsc,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  User,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Question {
  _id: string;
  title: string;
  content: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  tags: string[];
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  answers: string[];
  views: number;
  createdAt: string;
  isDeleted: boolean;
  acceptedAnswer?: string;
  isAnonymous?: boolean;
}

interface QuestionsResponse {
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminQuestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
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
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);

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

  const fetchQuestions = async () => {
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

      const response = await fetch(`/api/admin/questions?${params}`);
      if (response.ok) {
        const data: QuestionsResponse = await response.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch questions');
        setError('Failed to fetch questions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to soft delete this question? This will hide it from users but it can be restored later.')) {
      return;
    }

    setDeletingQuestion(questionId);

    try {
      const response = await fetch(`/api/questions/${questionId}/soft-delete`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Question soft deleted successfully');
        fetchQuestions(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to soft delete question');
      }
    } catch (error) {
      toast.error('An error occurred while soft deleting the question');
    } finally {
      setDeletingQuestion(null);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, filter, sort, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVoteCount = (votes: { upvotes: string[]; downvotes: string[] }) => {
    return votes.upvotes.length - votes.downvotes.length;
  };

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading questions...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Questions Management</h1>
          </div>
          <p className="text-gray-600">
            Manage all questions on the platform. You can view, search, and soft delete questions as needed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Active Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.filter(q => !q.isDeleted).length}
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
                  {questions.length > 0 ? Math.max(...questions.map(q => getVoteCount(q.votes))) : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">This Page</p>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
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
                placeholder="Search questions by title, content, or tags..."
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
                <option value="all">All Questions</option>
                <option value="unanswered">Unanswered</option>
                <option value="answered">Answered</option>
                <option value="no-answers">No Answers</option>
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
                <option value="views">Most Viewed</option>
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

        {/* Questions List */}
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Vote Count */}
                      <div className="flex flex-col items-center gap-1 min-w-[40px]">
                        <ThumbsUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {getVoteCount(question.votes)}
                        </span>
                        <ThumbsDown className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            href={`/questions/${question._id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {question.title}
                          </Link>
                          {question.isDeleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Deleted
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.map((tag) => (
                            <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Meta Information */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{question.author.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>{question.answers.length} answers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>{question.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(question.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Link href={`/questions/${question._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    
                    {!question.isDeleted && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSoftDeleteQuestion(question._id)}
                        disabled={deletingQuestion === question._id}
                        className="flex items-center gap-2"
                      >
                        {deletingQuestion === question._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {deletingQuestion === question._id ? 'Deleting...' : 'Soft Delete'}
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
            <p className="text-gray-600 mb-4">No questions found.</p>
            <p className="text-gray-500 text-sm">
              {search || filter !== 'all' ? 'Try adjusting your search or filters.' : 'No questions have been created yet.'}
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