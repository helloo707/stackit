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
  Loader2,
  X,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Check,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  User
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Answer {
  _id: string;
  content: string;
  question: {
    _id: string;
    title: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  isAccepted: boolean;
  createdAt: string;
  eli5Content?: string;
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

// Helper functions
function getVoteCount(votes: { upvotes: string[]; downvotes: string[] }) {
  return (votes?.upvotes?.length || 0) - (votes?.downvotes?.length || 0);
}

export default function MyAnswersPage() {
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

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedSearch = (value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 500);
    setSearchTimeout(timeout);
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchAnswers();
  }, [session, status, page, filter, sort, search]);

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

      const response = await fetch(`/api/user/answers?${params}`);
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

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm('Are you sure you want to delete this answer? This action cannot be undone.')) {
      return;
    }

    setDeletingAnswer(answerId);

    try {
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Answer deleted successfully');
        fetchAnswers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete answer');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the answer');
    } finally {
      setDeletingAnswer(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters = search || filter !== 'all' || sort !== 'newest';

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto"></div>
            <p className="mt-4 text-muted-foreground font-inter">Loading...</p>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-inter">My Answers</h1>
            <p className="text-muted-foreground mt-1 font-inter">
              {pagination.total} answers • {pagination.total > 0 ? `${Math.ceil(pagination.total / pagination.limit)} pages` : 'No answers yet'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/questions">
              <Button className="bg-blue hover:bg-blue-light font-inter">
                <Plus className="h-4 w-4 mr-2" />
                Browse Questions
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-2xl shadow-md border border-border p-6 mb-6 font-inter">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search your answers by content..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-10 pr-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground shadow-sm w-full font-inter"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue text-foreground font-inter shadow-sm"
              >
                <option value="all">All Answers</option>
                <option value="accepted">Accepted</option>
                <option value="not-accepted">Not Accepted</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue text-foreground font-inter shadow-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="votes">Most Voted</option>
                <option value="accepted">Accepted First</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full font-inter"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 font-inter">
            <p className="text-red-800 font-inter">{error}</p>
          </div>
        )}

        {/* Answers List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue font-inter" />
            <p className="mt-2 text-muted-foreground font-inter">Loading your answers...</p>
          </div>
        ) : answers.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground font-inter" />
            <h3 className="mt-4 text-lg font-medium text-foreground font-inter">No answers found</h3>
            <p className="mt-2 text-muted-foreground font-inter">
              {hasActiveFilters 
                ? 'Try adjusting your search or filters'
                : "You haven't answered any questions yet. Start helping others!"
              }
            </p>
            {!hasActiveFilters && (
              <Link href="/questions" className="mt-4 inline-block">
                <Button className="bg-blue hover:bg-blue-light font-inter">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Questions to Answer
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <div
                key={answer._id}
                className="bg-card rounded-2xl shadow-md border border-border p-6 hover:border-blue hover:shadow-lg transition-all font-inter"
              >
                <div className="flex gap-4">
                  {/* Stats */}
                  <div className="flex flex-col items-center space-y-2 text-xs text-muted-foreground min-w-[80px] font-inter">
                    <div className="text-center">
                      <div className="font-semibold text-blue font-inter">
                        {getVoteCount(answer.votes)}
                      </div>
                      <div>votes</div>
                    </div>
                    <div className="text-center">
                      {answer.isAccepted && (
                        <div className="text-emerald font-inter">
                          <Check className="h-6 w-6 mx-auto" />
                          <div className="text-xs">Accepted</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link 
                        href={`/questions/${answer.question._id}`}
                        className="text-lg font-semibold text-foreground hover:text-blue transition-colors font-inter"
                      >
                        {answer.question.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        {answer.isAccepted && (
                          <span className="bg-emerald/10 text-emerald text-xs px-2 py-1 rounded-full font-inter">
                            Accepted
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-3 font-inter">
                      {answer.content.replace(/<[^>]*>/g, '').substring(0, 300)}...
                    </p>

                    {/* Meta and Actions */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-inter">
                      <div className="flex items-center space-x-4">
                        <span>
                          Answered {formatDate(answer.createdAt)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{answer.votes?.upvotes?.length || 0}</span>
                          <ThumbsDown className="h-4 w-4" />
                          <span>{answer.votes?.downvotes?.length || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/questions/${answer.question._id}#answer-${answer._id}`}>
                          <Button variant="ghost" size="sm" className="font-inter">
                            View
                          </Button>
                        </Link>
                        <Link href={`/answers/${answer._id}/edit`}>
                          <Button variant="ghost" size="sm" className="font-inter">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAnswer(answer._id)}
                          disabled={deletingAnswer === answer._id}
                          className="text-red-600 hover:text-red-700 font-inter"
                        >
                          {deletingAnswer === answer._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="font-inter"
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    onClick={() => setPage(pageNum)}
                    className="font-inter"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="font-inter"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
} 