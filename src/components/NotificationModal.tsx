import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Bell, MessageSquare, ThumbsUp, Award, Bookmark, X } from 'lucide-react';
import Link from 'next/link';

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

const extractId = (item: string | { _id: string } | null | undefined): string | null => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  return item._id || null;
};

export default function NotificationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && status === 'authenticated') {
      fetchNotifications();
    }
    // eslint-disable-next-line
  }, [open, status]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications?page=1&limit=10');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter(n => !n.isRead).length);
    } catch (err) {
      setError('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const getNotificationDetails = (notification: Notification) => {
    switch (notification.type) {
      case 'answer':
        return {
          icon: <MessageSquare className="h-5 w-5 text-blue-600" />, details: notification.metadata?.questionTitle
        };
      case 'vote':
        return {
          icon: <ThumbsUp className="h-5 w-5 text-green-600" />, details: notification.metadata?.questionTitle
        };
      case 'bookmark':
        return {
          icon: <Bookmark className="h-5 w-5 text-purple-600" />, details: notification.metadata?.questionTitle
        };
      case 'accept':
        return {
          icon: <Award className="h-5 w-5 text-yellow-600" />, details: notification.metadata?.questionTitle
        };
      default:
        return {
          icon: <Bell className="h-5 w-5 text-gray-600" />, details: ''
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-30">
      <div ref={modalRef} className="mt-16 mr-6 w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">Notifications</span>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No notifications found.</div>
          ) : (
            notifications.map(notification => {
              const { icon, details } = getNotificationDetails(notification);
              return (
                <div
                  key={notification._id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${notification.isRead ? '' : 'bg-blue-50'}`}
                >
                  <div className="mt-1">{icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 text-sm">{notification.title}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatDate(notification.createdAt)}</span>
                    </div>
                    <div className="text-gray-700 text-sm mb-1">{notification.message}</div>
                    {details && (
                      <div className="text-xs text-gray-500 mb-1">{details}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {!notification.isRead && (
                        <Button size="sm" variant="outline" onClick={() => markAsRead(notification._id)}>
                          Mark as Read
                        </Button>
                      )}
                      {(notification.relatedQuestion || notification.relatedAnswer) && (
                        <Link
                          href={
                            extractId(notification.relatedQuestion)
                              ? `/questions/${extractId(notification.relatedQuestion)}`
                              : (extractId(notification.relatedAnswer)
                                  ? `/questions/${extractId(notification.relatedAnswer)}`
                                  : '#')
                          }
                          className="text-blue-600 hover:underline text-xs"
                          onClick={onClose}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 