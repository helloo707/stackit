'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FlagButton from '@/components/FlagButton';
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

interface Answer {
  _id: string;
  content: string;
  eli5Content?: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  isAccepted: boolean;
  createdAt: string;
  isAI?: boolean; // <-- Add this line
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

  // Add new filter states
  const [time, setTime] = useState('all');
  const [status, setStatus] = useState('all');
  const [popularity, setPopularity] = useState('default');

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
        time,
        status,
        popularity,
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
  }, [page, filter, sort, search, selectedTags, time, status, popularity]);

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground  font-inter">Questions</h1>
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
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
            {/* Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Any Time</option>
                <option value="24h">Last 24 hours</option>
                <option value="week">Last week</option>
                <option value="month">Last month</option>
              </select>
            </div>
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Any Status</option>
                <option value="accepted">Has Accepted Answer</option>
                <option value="no-accepted">No Accepted Answer</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            {/* Popularity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Popularity</label>
              <select
                value={popularity}
                onChange={e => setPopularity(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Default</option>
                <option value="most-upvoted">Most Upvoted</option>
                <option value="most-viewed">Most Viewed</option>
                <option value="most-answered">Most Answered</option>
                <option value="hot">Hot/Trending</option>
              </select>
            </div>
            {/* Sort (existing) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="votes">Most Voted</option>
                <option value="views">Most Viewed</option>
                <option value="recent">Recently Active</option>
              </select>
            </div>
            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full md:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
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
                    
                    {/* Question Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-inter">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{question.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{question.answers.length}</span>
                        </div>
                        <span>•</span>
                        <span>{formatDate(question.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FlagButton 
                          contentType="question" 
                          contentId={question._id} 
                          className="p-1"
                        />
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
    </div>
  );
} 