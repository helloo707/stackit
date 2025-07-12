'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  MessageSquare,
  Eye,
  Loader2,
  X,
  Tag,
  CheckCircle,
  AlertCircle
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

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
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

  useEffect(() => {
    fetchQuestions();
  }, [page, filter, sort, search, selectedTags]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
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
      }
    } catch {
      toast.error('An error occurred while fetching questions');
    } finally {
      setLoading(false);
    }
  };

  const getVoteCount = (votes: { upvotes: string[]; downvotes: string[] }) => {
    return votes.upvotes.length - votes.downvotes.length;
  };

  const getAnswerCount = (answers: string[]) => {
    return answers.length;
  };

  const isAnswered = (question: Question) => {
    return question.acceptedAnswer || question.answers.length > 0;
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
            <p className="text-gray-600 mt-1">
              {pagination.total} questions • {pagination.total > 0 ? `${Math.ceil(pagination.total / pagination.limit)} pages` : 'No questions yet'}
            </p>
          </div>
          <Link href="/questions/ask">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Ask Question
            </Button>
          </Link>
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
                defaultValue={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="h-3 w-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No questions found</h3>
            <p className="mt-2 text-gray-600">
              {hasActiveFilters 
                ? 'Try adjusting your search or filters'
                : 'Be the first to ask a question!'
              }
            </p>
            {!hasActiveFilters && (
              <Link href="/questions/ask" className="mt-4 inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700">
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
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Stats */}
                  <div className="flex flex-col items-center space-y-2 text-sm text-gray-500 min-w-[80px]">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {getVoteCount(question.votes)}
                      </div>
                      <div>votes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {getAnswerCount(question.answers)}
                      </div>
                      <div>answers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {question.views}
                      </div>
                      <div>views</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link 
                        href={`/questions/${question._id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {question.title}
                      </Link>
                      {isAnswered(question) && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {question.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
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