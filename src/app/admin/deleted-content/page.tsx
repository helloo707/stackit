'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  RotateCcw, 
  Eye, 
  User,
  Calendar,
  MessageSquare,
  FileText,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DeletedQuestion {
  _id: string;
  title: string;
  content: string;
  author: {
    name: string;
    email: string;
    image?: string;
  };
  tags: string[];
  isDeleted: boolean;
  deletedAt: string;
  createdAt: string;
}

interface DeletedAnswer {
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
  isDeleted: boolean;
  deletedAt: string;
  createdAt: string;
}

interface DeletedContentResponse {
  deletedQuestions: DeletedQuestion[];
  deletedAnswers: DeletedAnswer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    totalQuestions: number;
    totalAnswers: number;
  };
}

export default function AdminDeletedContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deletedQuestions, setDeletedQuestions] = useState<DeletedQuestion[]>([]);
  const [deletedAnswers, setDeletedAnswers] = useState<DeletedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentType, setContentType] = useState<'all' | 'questions' | 'answers'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    totalQuestions: 0,
    totalAnswers: 0,
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

  const fetchDeletedContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        type: contentType,
      });

      const response = await fetch(`/api/admin/deleted-content?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch deleted content');
      }

      const data: DeletedContentResponse = await response.json();
      setDeletedQuestions(data.deletedQuestions);
      setDeletedAnswers(data.deletedAnswers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const restoreQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/questions/${questionId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Question restored successfully');
        fetchDeletedContent(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to restore question');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const restoreAnswer = async (answerId: string) => {
    try {
      const response = await fetch(`/api/answers/${answerId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Answer restored successfully');
        fetchDeletedContent(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to restore answer');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  useEffect(() => {
    fetchDeletedContent();
  }, [currentPage, contentType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && deletedQuestions.length === 0 && deletedAnswers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading deleted content...</div>
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
            <Trash2 className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Deleted Content Management</h1>
          </div>
          <p className="text-gray-600">
            Manage soft deleted questions and answers. You can restore content or permanently delete it.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Deleted Questions</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalQuestions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Deleted Answers</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalAnswers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-500">Total Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex gap-2">
            <Button
              variant={contentType === 'all' ? 'default' : 'outline'}
              onClick={() => setContentType('all')}
            >
              All Content
            </Button>
            <Button
              variant={contentType === 'questions' ? 'default' : 'outline'}
              onClick={() => setContentType('questions')}
            >
              Questions Only
            </Button>
            <Button
              variant={contentType === 'answers' ? 'default' : 'outline'}
              onClick={() => setContentType('answers')}
            >
              Answers Only
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Deleted Questions */}
        {deletedQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deleted Questions</h2>
            <div className="space-y-4">
              {deletedQuestions.map((question) => (
                <div key={question._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {question.tags.map((tag) => (
                          <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{question.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(question.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span>Deleted: {formatDate(question.deletedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreQuestion(question._id)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deleted Answers */}
        {deletedAnswers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deleted Answers</h2>
            <div className="space-y-4">
              {deletedAnswers.map((answer) => (
                <div key={answer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Answer to: </span>
                        <span className="text-sm font-medium text-blue-600">{answer.question.title}</span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{answer.content}</p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{answer.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(answer.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span>Deleted: {formatDate(answer.deletedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreAnswer(answer._id)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {deletedQuestions.length === 0 && deletedAnswers.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No deleted content found.</p>
            <p className="text-gray-500 text-sm">All content is currently active.</p>
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