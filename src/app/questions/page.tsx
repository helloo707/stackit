'use client';

import { useState, useEffect } from 'react';
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
  Loader2
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchQuestions();
  }, [page, filter, sort, search]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort,
        filter,
        ...(search && { search }),
      });

      const response = await fetch(`/api/questions?${params}`);
      if (response.ok) {
        const data: QuestionsResponse = await response.json();
        setQuestions(data.questions);
        setPagination(data.pagination);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Questions</h1>
            <p className="text-gray-600">Find answers to your questions or help others</p>
          </div>
          <Link href="/questions/ask">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Ask Question
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex items-center gap-2 ${filter === 'all' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => setFilter('all')}
              >
                <Filter className="h-4 w-4" />
                All Questions
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex items-center gap-2 ${sort === 'votes' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => setSort('votes')}
              >
                <TrendingUp className="h-4 w-4" />
                Most Voted
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex items-center gap-2 ${sort === 'newest' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => setSort('newest')}
              >
                <Clock className="h-4 w-4" />
                Recent
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`flex items-center gap-2 ${filter === 'unanswered' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => setFilter('unanswered')}
              >
                <MessageSquare className="h-4 w-4" />
                Unanswered
              </Button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading questions...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No questions found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question: Question) => (
              <div key={question._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Stats */}
                  <div className="flex flex-col items-center text-center min-w-[80px]">
                    <div className="text-lg font-semibold text-gray-900">{getVoteCount(question.votes)}</div>
                    <div className="text-sm text-gray-500">votes</div>
                    <div className="text-lg font-semibold text-gray-900 mt-2">{getAnswerCount(question.answers)}</div>
                    <div className="text-sm text-gray-500">answers</div>
                    <div className="text-sm text-gray-500 mt-2">{question.views}</div>
                    <div className="text-xs text-gray-400">views</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/questions/${question._id}`}>
                        <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                          {question.title}
                        </h3>
                      </Link>
                      {isAnswered(question) && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Answered
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {question.content}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {question.tags.map((tag: string) => (
                        <Link key={tag} href={`/tags/${tag}`}>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-200 cursor-pointer">
                            {tag}
                          </span>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>Asked by {question.author.name}</span>
                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{question.views}</span>
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
                    variant="outline"
                    size="sm"
                    className={page === pageNum ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
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
                    className={page === pagination.pages ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
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