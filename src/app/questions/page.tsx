'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

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

// Helper functions
function getVoteCount(votes: { upvotes: string[]; downvotes: string[] }) {
  return (votes?.upvotes?.length || 0) - (votes?.downvotes?.length || 0);
}

function getAnswerCount(question: Question) {
  return question.answers?.length || 0;
}

export default function QuestionsPage() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 500);
    setSearchTimeout(timeout);
  }, [searchTimeout]);

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
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
      });

      const response = await fetch(`/api/questions?${params}`);
      if (response.ok) {
        const data: QuestionsResponse = await response.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
        
        // Extract unique tags from questions
        const tags = new Set<string>();
        data.questions.forEach(q => q.tags.forEach(tag => tags.add(tag)));
        setAvailableTags(Array.from(tags).sort());
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

  const checkBookmarkStatus = async (questionId: string) => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/bookmarks/check/${questionId}`);
      if (response.ok) {
        const data = await response.json();
        setBookmarkedQuestions(prev => {
          const newSet = new Set(prev);
          if (data.isBookmarked) {
            newSet.add(questionId);
          } else {
            newSet.delete(questionId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const toggleBookmark = async (questionId: string) => {
    if (!session) {
      toast.error('Please sign in to bookmark questions');
      return;
    }

    const isBookmarked = bookmarkedQuestions.has(questionId);

    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks/${questionId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setBookmarkedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
          });
          toast.success('Bookmark removed');
        } else {
          toast.error('Failed to remove bookmark');
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionId }),
        });

        if (response.ok) {
          setBookmarkedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.add(questionId);
            return newSet;
          });
          toast.success('Question bookmarked');
        } else {
          const error = await response.json();
          toast.error(error.message || 'Failed to bookmark question');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, filter, sort, search, selectedTags]);

  useEffect(() => {
    // Check bookmark status for all questions when they load
    if (questions.length > 0 && session) {
      questions.forEach(question => {
        checkBookmarkStatus(question._id);
      });
    }
  }, [questions, session]);



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setSort('newest');
    setSelectedTags([]);
    setPage(1);
  };

  const hasActiveFilters = search || filter !== 'all' || sort !== 'newest' || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-inter">Questions</h1>
          <p className="text-muted-foreground mt-1 font-inter">
            {pagination.total} questions • {pagination.total > 0 ? `${Math.ceil(pagination.total / pagination.limit)} pages` : 'No questions yet'}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-md">
            {session && (
              <Link href="/bookmarks" className="w-full sm:w-auto">
                <Button variant="outline" className="flex items-center gap-2 w-full">
                  <BookmarkCheck className="h-4 w-4" />
                  My Bookmarks
                </Button>
              </Link>
            )}
            <Link href="/questions/ask" className="w-full sm:w-auto">
              <Button className="bg-blue hover:bg-blue-light w-full">
                Ask Question
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-6 shadow-md w-full max-w-full">
          {/* Search */}
          <div className="mb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search questions by title, content, or tags..."
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-10 pr-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground shadow-sm w-full"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-4 w-full">
            {/* Filter */}
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue text-foreground font-inter shadow-sm"
              >
                <option value="all">All Questions</option>
                <option value="unanswered">Unanswered</option>
                <option value="answered">Answered</option>
                <option value="no-answers">No Answers</option>
              </select>
            </div>

            {/* Sort */}
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue text-foreground font-inter shadow-sm"
              >
                <option value="newest">Newest</option>
                <option value="votes">Most Voted</option>
                <option value="views">Most Viewed</option>
                <option value="recent">Recently Active</option>
              </select>
            </div>

            {/* Tags (on desktop, take up remaining space) */}
            <div className="w-full md:flex-1">
              <label className="block text-sm font-medium text-foreground mb-2 font-inter">Filter by Tags</label>
              <div className="flex flex-wrap gap-2 w-full">
                {availableTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors font-inter border border-border shadow-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-blue text-white'
                        : 'bg-muted text-foreground hover:bg-muted-foreground/10'
                    }`}
                  >
                    <Tag className="h-3 w-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters (always at the bottom, full width on mobile, right on desktop) */}
          {hasActiveFilters && (
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full md:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-inter">{error}</p>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue" />
            <p className="mt-2 text-muted-foreground font-inter">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground font-inter">No questions found</h3>
            <p className="mt-2 text-muted-foreground font-inter">
              {hasActiveFilters 
                ? 'Try adjusting your search or filters'
                : 'Be the first to ask a question!'
              }
            </p>
            {!hasActiveFilters && (
              <Link href="/questions/ask" className="mt-4 inline-block">
                <Button className="bg-blue hover:bg-blue-light">
                  Ask Question
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question._id}
                className="card-modern flex gap-0 md:gap-6 items-stretch hover:border-blue hover:shadow-lg transition-all p-0 md:p-0"
              >
                {/* Stats Column */}
                <div className="flex flex-col justify-center items-center min-w-[90px] bg-muted/70 rounded-l-2xl py-6 px-2 md:px-4 text-center border-r border-border">
                  <div className="mb-4">
                    <div className="font-bold text-lg text-blue font-inter">{getVoteCount(question.votes)}</div>
                    <div className="text-xs text-muted-foreground font-inter">votes</div>
                  </div>
                  <div className="mb-4">
                    <div className="font-bold text-lg text-emerald font-inter">{getAnswerCount(question)}</div>
                    <div className="text-xs text-muted-foreground font-inter">answers</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-orange font-inter">{question.views}</div>
                    <div className="text-xs text-muted-foreground font-inter">views</div>
                  </div>
                </div>
                {/* Content Column */}
                <div className="flex-1 flex flex-col justify-between p-6">
                  <div className="flex items-start justify-between mb-2">
                    <Link 
                      href={`/questions/${question._id}`}
                      className="text-lg font-semibold text-foreground hover:text-blue transition-colors font-inter"
                    >
                      {question.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      {getAnswerCount(question) > 0 && (
                        <span className="bg-emerald/10 text-emerald text-xs px-2 py-1 rounded-full font-inter">
                          Answered
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(question._id)}
                        className="p-1"
                      >
                        {bookmarkedQuestions.has(question._id) ? (
                          <BookmarkCheck className="h-5 w-5 text-blue" />
                        ) : (
                          <Bookmark className="h-5 w-5 text-muted-foreground hover:text-blue" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-3 line-clamp-2 font-inter">
                    {question.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                  </p>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {question.tags.map((tag) => (
                      <Link key={tag} href={`/tags/${tag}`}>
                        <span className="bg-blue/10 text-blue text-xs px-2 py-1 rounded hover:bg-blue/20 cursor-pointer font-inter">
                          {tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center space-x-4">
                      <span>
                        Asked {formatDate(question.createdAt)}
                      </span>
                      <span>
                        by {question.isAnonymous ? 'Anonymous' : question.author.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>{question.views}</span>
                      <MessageSquare className="h-4 w-4" />
                      <span>{question.answers.length}</span>
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
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
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