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
  XCircle,
  Ban,
  Filter,
  Search,
  Shield,
  TrendingDown,
  TrendingUp
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
      role?: string; // Added role for ban functionality
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground font-inter">Loading admin panel...</p>
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
      spam: 'bg-red/10 text-red border-red/20',
      inappropriate: 'bg-orange/10 text-orange border-orange/20',
      offensive: 'bg-red/10 text-red border-red/20',
      duplicate: 'bg-yellow/10 text-yellow border-yellow/20',
      misleading: 'bg-purple/10 text-purple border-purple/20',
      other: 'bg-muted text-muted-foreground border-border',
    };
    return colors[reason] || 'bg-muted text-muted-foreground border-border';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow/10 text-yellow border-yellow/20',
      resolved: 'bg-emerald/10 text-emerald border-emerald/20',
      dismissed: 'bg-muted text-muted-foreground border-border',
    };
    return colors[status] || 'bg-muted text-muted-foreground border-border';
  };

  if (loading && flags.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground font-inter">Loading flagged content...</p>
        </div>
      </div>
    );
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red/10 rounded-2xl">
                <Flag className="h-8 w-8 text-red" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-inter">Flagged Content Management</h1>
                <p className="text-muted-foreground font-inter">
                  Review and moderate flagged questions and answers. Take appropriate action to maintain community standards.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow/10 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-yellow" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-inter">Pending Flags</p>
                  <p className="text-2xl font-bold text-foreground font-inter">
                    {flags.filter(f => f.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald/10 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-inter">Resolved</p>
                  <p className="text-2xl font-bold text-foreground font-inter">
                    {flags.filter(f => f.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-xl">
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-inter">Dismissed</p>
                  <p className="text-2xl font-bold text-foreground font-inter">
                    {flags.filter(f => f.status === 'dismissed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue/10 rounded-lg">
                <Filter className="h-5 w-5 text-blue" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-inter">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-inter">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue font-inter"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 font-inter">Content Type</label>
                <select
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue font-inter"
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
            <div className="bg-red/10 border border-red/20 rounded-2xl p-4 mb-8">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red" />
                <p className="text-red font-inter">{error}</p>
              </div>
            </div>
          )}

          {/* Flagged Content */}
          {flags.length > 0 ? (
            <div className="space-y-6">
              {flags.map((flag) => (
                <div key={flag._id} className="bg-card border border-border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Content Type and Status */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(flag.status)}`}>
                          {flag.status}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue border border-blue/20">
                          {flag.contentType}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getReasonColor(flag.reason)}`}>
                          {flag.reason}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        {flag.contentType === 'question' ? (
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2 font-inter">
                              {flag.contentId.title}
                            </h3>
                            <p className="text-muted-foreground mb-3 line-clamp-2 font-inter">
                              {flag.contentId.content}
                            </p>
                            {flag.contentId.tags && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {flag.contentId.tags.map((tag) => (
                                  <span key={tag} className="bg-blue/10 text-blue text-xs px-2 py-1 rounded-full border border-blue/20 font-inter">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="mb-2">
                              <span className="text-sm text-muted-foreground font-inter">Answer to: </span>
                              <span className="text-sm font-medium text-blue font-inter">
                                {flag.contentId.question?.title}
                              </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 font-inter">
                              {flag.contentId.content}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Meta Information */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground font-inter">
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
                      <div className="flex flex-col gap-3 ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModeration(flag._id, 'dismiss', 'dismissed')}
                          className="flex items-center gap-2 border-yellow text-yellow hover:bg-yellow/5"
                        >
                          <XCircle className="h-4 w-4" />
                          Dismiss
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModeration(flag._id, 'resolve', 'resolved')}
                          className="flex items-center gap-2 border-emerald text-emerald hover:bg-emerald/5"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModeration(flag._id, 'soft-delete', 'resolved')}
                          className="flex items-center gap-2 border-red text-red hover:bg-red/5"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Content
                        </Button>
                        {flag.contentId.author && flag.contentId.author.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModeration(flag._id, 'ban-user', 'resolved')}
                            className="flex items-center gap-2 border-red text-red hover:bg-red/5"
                          >
                            <Ban className="h-4 w-4" />
                            Ban User
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-lg p-12 text-center">
              <div className="p-4 bg-muted/50 rounded-2xl inline-block mb-4">
                <Flag className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-foreground mb-2 font-inter text-lg">No flagged content found.</p>
              <p className="text-muted-foreground font-inter">All content is currently clean and follows community guidelines.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="font-inter"
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
                        className="font-inter"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {pagination.pages > 5 && (
                    <>
                      <span className="text-muted-foreground font-inter">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(pagination.pages)}
                        className="font-inter"
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
                    className="font-inter"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 