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
  AlertTriangle,
  Loader2
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
  // All hooks must be called first, before any conditional logic
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
    // Only fetch content if user is authenticated and is admin
    if (session?.user?.role === 'admin') {
      fetchDeletedContent();
    }
  }, [currentPage, contentType, session?.user?.role]);

  // Handle authentication and authorization after all hooks
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-gray-300">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && deletedQuestions.length === 0 && deletedAnswers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <Navigation />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-300">Loading deleted content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      <Navigation />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm border border-red-500/30">
              <Trash2 className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-['Orbitron']">Deleted Content Management</h1>
              <p className="text-red-200 text-sm">
                Manage soft deleted questions and answers. You can restore content or permanently delete it.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Deleted Questions</p>
                <p className="text-2xl font-bold text-white">{pagination.totalQuestions}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Deleted Answers</p>
                <p className="text-2xl font-bold text-white">{pagination.totalAnswers}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/50 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Deleted</p>
                <p className="text-2xl font-bold text-white">{pagination.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-8">
          <div className="flex gap-2">
            <Button
              variant={contentType === 'all' ? 'default' : 'outline'}
              onClick={() => setContentType('all')}
              className={contentType === 'all' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 backdrop-blur-sm'}
            >
              All Content
            </Button>
            <Button
              variant={contentType === 'questions' ? 'default' : 'outline'}
              onClick={() => setContentType('questions')}
              className={contentType === 'questions' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 backdrop-blur-sm'}
            >
              Questions Only
            </Button>
            <Button
              variant={contentType === 'answers' ? 'default' : 'outline'}
              onClick={() => setContentType('answers')}
              className={contentType === 'answers' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50 backdrop-blur-sm'}
            >
              Answers Only
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Deleted Questions */}
        {deletedQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Deleted Questions</h2>
            <div className="space-y-4">
              {deletedQuestions.map((question) => (
                <div key={question._id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/50 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{question.title}</h3>
                      <p className="text-slate-300 mb-3 line-clamp-2">{question.content}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {question.tags.map((tag) => (
                          <span key={tag} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-slate-400">
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
                        className="border-green-500 text-green-400 hover:bg-green-500/20 backdrop-blur-sm"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
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
            <h2 className="text-xl font-semibold text-white mb-4">Deleted Answers</h2>
            <div className="space-y-4">
              {deletedAnswers.map((answer) => (
                <div key={answer._id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-lg hover:bg-slate-700/50 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-sm text-slate-400">Answer to: </span>
                        <span className="text-sm font-medium text-blue-400">{answer.question.title}</span>
                      </div>
                      <p className="text-slate-300 mb-3 line-clamp-2">{answer.content}</p>
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-slate-400">
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
                        className="border-green-500 text-green-400 hover:bg-green-500/20 backdrop-blur-sm"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
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
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
            <Trash2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 mb-4">No deleted content found.</p>
            <p className="text-slate-400 text-sm">All content is currently active.</p>
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
                className="border-slate-600 text-slate-400 hover:bg-slate-700/50 backdrop-blur-sm"
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
                    className={currentPage === pageNum ? 'bg-blue-500 hover:bg-blue-600' : 'border-slate-600 text-slate-400 hover:bg-slate-700/50 backdrop-blur-sm'}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {pagination.pages > 5 && (
                <>
                  <span className="text-slate-400">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.pages)}
                    className="border-slate-600 text-slate-400 hover:bg-slate-700/50 backdrop-blur-sm"
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
                className="border-slate-600 text-slate-400 hover:bg-slate-700/50 backdrop-blur-sm"
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