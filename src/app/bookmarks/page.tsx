'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  BookmarkCheck, 
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface BookmarkedQuestion {
  _id: string;
  question: {
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
  };
  createdAt: string;
}

interface BookmarksResponse {
  bookmarks: BookmarkedQuestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/bookmarks?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const data: BookmarksResponse = await response.json();
      setBookmarks(data.bookmarks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (questionId: string) => {
    try {
      const response = await fetch(`/api/bookmarks/${questionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookmarks(prev => prev.filter(bookmark => bookmark.question._id !== questionId));
        toast.success('Bookmark removed');
        
        // Refresh the list if we removed the last item on the page
        if (bookmarks.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchBookmarks();
        }
      } else {
        toast.error('Failed to remove bookmark');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [currentPage]);

  const getVoteCount = (votes: { upvotes: string[]; downvotes: string[] }) => {
    return votes.upvotes.length - votes.downvotes.length;
  };

  const getAnswerCount = (answers: string[]) => {
    return answers.length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground font-inter">Loading bookmarks...</div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/questions" className="inline-flex items-center text-blue hover:text-blue-light mb-4 font-inter">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <BookmarkCheck className="h-8 w-8 text-blue" />
              <h1 className="text-3xl font-bold text-foreground font-inter">My Bookmarks</h1>
            </div>
            <p className="text-muted-foreground font-inter">
              {pagination.total > 0 
                ? `You have ${pagination.total} bookmarked question${pagination.total !== 1 ? 's' : ''}`
                : 'No bookmarks yet. Start bookmarking questions you find interesting!'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800 font-inter">{error}</p>
            </div>
          )}

          {/* Bookmarks List */}
          <div className="space-y-4">
            {bookmarks.length === 0 ? (
              <div className="bg-card rounded-2xl shadow-md border border-border p-8 text-center">
                <BookmarkCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4 font-inter">No bookmarks found.</p>
                <Link href="/questions">
                  <Button className="bg-blue hover:bg-blue-light font-inter">
                    Browse Questions
                  </Button>
                </Link>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div key={bookmark._id} className="bg-card rounded-2xl shadow-md border border-border p-6 hover:border-blue hover:shadow-lg transition-all font-inter">
                  <div className="flex gap-4">
                    {/* Stats */}
                    <div className="flex flex-col items-center text-center min-w-[80px]">
                      <div className="text-lg font-semibold text-blue font-inter">{getVoteCount(bookmark.question.votes)}</div>
                      <div className="text-xs text-muted-foreground font-inter">votes</div>
                      <div className="text-lg font-semibold text-emerald mt-2 font-inter">{getAnswerCount(bookmark.question.answers)}</div>
                      <div className="text-xs text-muted-foreground font-inter">answers</div>
                      <div className="text-xs text-orange mt-2 font-inter">{bookmark.question.views}</div>
                      <div className="text-xs text-muted-foreground font-inter">views</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/questions/${bookmark.question._id}`}>
                          <h3 className="text-lg font-semibold text-foreground hover:text-blue transition-colors cursor-pointer font-inter">
                            {bookmark.question.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2">
                          {getAnswerCount(bookmark.question.answers) > 0 && (
                            <span className="bg-emerald/10 text-emerald text-xs px-2 py-1 rounded-full font-inter">
                              Answered
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBookmark(bookmark.question._id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <BookmarkCheck className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2 font-inter">
                        {bookmark.question.content}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {bookmark.question.tags.map((tag) => (
                          <Link key={tag} href={`/tags/${tag}`}>
                            <span className="bg-blue/10 text-blue text-xs px-2 py-1 rounded hover:bg-blue/20 cursor-pointer font-inter">
                              {tag}
                            </span>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-inter">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Asked by {bookmark.question.author.name}</span>
                          </div>
                          <span>{formatDate(bookmark.question.createdAt)}</span>
                          <span>Bookmarked {formatDate(bookmark.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{bookmark.question.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
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
          )}
        </div>
      </div>
    </div>
  );
} 