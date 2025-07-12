'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Flag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface FlagButtonProps {
  contentType: 'question' | 'answer';
  contentId: string;
  className?: string;
}

const flagReasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'other', label: 'Other' },
];

export default function FlagButton({ contentType, contentId, className }: FlagButtonProps) {
  const { data: session } = useSession();
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);

  const handleFlag = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for flagging');
      return;
    }

    setIsFlagging(true);
    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: selectedReason,
        }),
      });

      if (response.ok) {
        toast.success('Content flagged successfully');
        setShowFlagModal(false);
        setSelectedReason('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to flag content');
      }
    } catch (error) {
      toast.error('An error occurred while flagging');
    } finally {
      setIsFlagging(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowFlagModal(true)}
        className={`text-gray-500 hover:text-red-600 ${className}`}
      >
        <Flag className="h-4 w-4" />
        <span className="ml-1">Flag</span>
      </Button>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold">Flag Content</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please select a reason for flagging this {contentType}:
            </p>

            <div className="space-y-2 mb-6">
              {flagReasons.map((reason) => (
                <label key={reason.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flagReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-red-600"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFlagModal(false);
                  setSelectedReason('');
                }}
                disabled={isFlagging}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleFlag}
                disabled={isFlagging || !selectedReason}
              >
                {isFlagging ? 'Flagging...' : 'Flag Content'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 