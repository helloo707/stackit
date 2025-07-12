'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  Ban, 
  AlertTriangle, 
  LogOut,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';

interface BanInfo {
  isBanned: boolean;
  bannedAt?: string;
  banReason?: string;
  bannedBy?: {
    name: string;
    email: string;
  };
}

export default function BannedPage() {
  const { data: session } = useSession();
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        const response = await fetch('/api/user/check-ban');
        if (response.ok) {
          const data = await response.json();
          setBanInfo(data);
        }
      } catch (error) {
        console.error('Error checking ban status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      checkBanStatus();
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not banned, redirect them away
  if (!banInfo?.isBanned) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">You are not banned. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Banned</h1>
          <p className="text-gray-600">
            Your account has been suspended from accessing this platform.
          </p>
        </div>

        {/* Ban Information */}
        <div className="space-y-4 mb-8">
          {banInfo.bannedAt && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Banned On</p>
                <p className="text-sm text-gray-600">{formatDate(banInfo.bannedAt)}</p>
              </div>
            </div>
          )}

          {banInfo.banReason && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Reason</p>
                <p className="text-sm text-red-700">{banInfo.banReason}</p>
              </div>
            </div>
          )}

          {banInfo.bannedBy && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Banned By</p>
                <p className="text-sm text-gray-600">{banInfo.bannedBy.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">What does this mean?</p>
              <p className="text-sm text-blue-700 mt-1">
                Your account has been suspended due to a violation of our community guidelines. 
                You cannot access the platform or create new content until the ban is lifted.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 