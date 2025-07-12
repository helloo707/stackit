'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle, 
  MessageSquare, 
  ThumbsUp, 
  Award,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import "@/models/Question";
import "@/models/Answer";
import "@/models/User";

interface Notification {
  _id: string;
  type: 'answer' | 'vote' | 'accept' | 'flag' | 'admin' | 'bookmark';
  title: string;
  message: string;
  relatedQuestion?: { _id: string; title?: string } | string | null;
  relatedAnswer?: { _id: string; content?: string } | string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    questionTitle?: string;
    answerSnippet?: string;
    senderName?: string;
    senderImage?: string;
    actionDetails?: {
      who: string;
      what: string;
      where: string;
    };
  };
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function to extract ID safely
const extractId = (item: string | { _id: string } | null | undefined): string | null => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return item._id || null;
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Use effect for authentication and routing
  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchNotifications();
    }
  }, [status, session, currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      console.log('Fetching notifications with params:', params.toString());

      const response = await fetch(`/api/notifications?${params}`);
      
      console.log('Fetch response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', errorText);
        throw new Error('Failed to fetch notifications');
      }

      const data: NotificationsResponse = await response.json();
      console.log('Notifications data:', JSON.stringify(data.notifications, null, 2));
      
      // Log specific details about related questions and answers
      data.notifications.forEach((notification, index) => {
        console.log(`Notification ${index} details:`, {
          relatedQuestion: notification.relatedQuestion,
          relatedAnswer: notification.relatedAnswer,
        });
      });

      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Full error in fetchNotifications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state to mark as read
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif._id) 
              ? { ...notif, isRead: true } 
              : notif
          )
        );
        toast.success('Notifications marked as read');
      } else {
        toast.error('Failed to mark notifications as read');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Render loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Render unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please sign in to view notifications</p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => fetchNotifications()} className="mr-4">
            Retry
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Detailed notification type mapping
  const getNotificationDetails = (notification: Notification) => {
    switch (notification.type) {
      case 'answer':
        return {
          icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
          color: 'blue',
          details: [
            { label: 'Question', value: notification.metadata?.questionTitle },
            { label: 'Answer Snippet', value: notification.metadata?.answerSnippet },
            { label: 'Sender', value: notification.metadata?.senderName }
          ]
        };
      case 'vote':
        return {
          icon: <ThumbsUp className="h-6 w-6 text-green-600" />,
          color: 'green',
          details: [
            { label: 'Question', value: notification.metadata?.questionTitle },
            { label: 'Vote Type', value: notification.message.includes('upvote') ? 'Upvote' : 'Downvote' },
            { label: 'Sender', value: notification.metadata?.senderName }
          ]
        };
      case 'bookmark':
        return {
          icon: <Bookmark className="h-6 w-6 text-purple-600" />,
          color: 'purple',
          details: [
            { label: 'Question', value: notification.metadata?.questionTitle },
            { label: 'Sender', value: notification.metadata?.senderName }
          ]
        };
      case 'accept':
        return {
          icon: <Award className="h-6 w-6 text-yellow-600" />,
          color: 'yellow',
          details: [
            { label: 'Question', value: notification.metadata?.questionTitle },
            { label: 'Action', value: 'Answer Accepted' }
          ]
        };
      default:
        return {
          icon: <Bell className="h-6 w-6 text-gray-600" />,
          color: 'gray',
          details: []
        };
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          </div>
          <p className="text-gray-600">
            {pagination.total > 0 
              ? `You have ${pagination.total} notification${pagination.total !== 1 ? 's' : ''}`
              : 'No notifications yet.'
            }
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-6">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No notifications found.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const notificationDetails = getNotificationDetails(notification);
              
              return (
                <div 
                  key={notification._id} 
                  className={`
                    bg-white rounded-lg shadow-md border 
                    ${notification.isRead ? 'border-gray-200' : `border-${notificationDetails.color}-200 bg-${notificationDetails.color}-50`}
                    p-6 hover:shadow-lg transition-all
                  `}
                >
                  <div className="flex items-start space-x-4">
                    {/* Notification Icon */}
                    <div className="mt-1">
                      {notificationDetails.icon}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1">
                      {/* Header with Sender Info */}
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {/* Notification Message */}
                      <p className="text-gray-700 mb-4">
                        {notification.message}
                      </p>


                      {/* Detailed Action Information */}
                      {notification.metadata?.actionDetails && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Award className="h-4 w-4 mr-2 text-yellow-500" />
                            Action Details
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                              <span className="text-xs text-gray-500 block mb-1">Who</span>
                              <span className="text-sm text-gray-800 font-medium">
                                {notification.metadata.actionDetails.who}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                              <span className="text-xs text-gray-500 block mb-1">What</span>
                              <span className="text-sm text-gray-800 font-medium">
                                {notification.metadata.actionDetails.what}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                              <span className="text-xs text-gray-500 block mb-1">Where</span>
                              <span className="text-sm text-gray-800 font-medium truncate">
                                {notification.metadata.actionDetails.where}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Links */}
                      <div className="mt-4 flex justify-between items-center">
                        {/* Mark as Read Button */}
                        {!notification.isRead && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markAsRead([notification._id])}
                          >
                            Mark as Read
                          </Button>
                        )}

                        {/* View Details Link */}
                        {(notification.relatedQuestion || notification.relatedAnswer) && (
                          <Link 
                            href={
                              extractId(notification.relatedQuestion)
                                ? `/questions/${extractId(notification.relatedQuestion)}`
                                : (extractId(notification.relatedAnswer)
                                    ? `/questions/${extractId(notification.relatedAnswer)}`
                                    : '#')
                            } 
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Related Content
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center space-x-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 