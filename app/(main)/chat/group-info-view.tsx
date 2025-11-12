'use client';

import React, { useState } from 'react';
import { Info, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface GroupInfoViewProps {
  currentUserMapping: any;
  onMarkAsRead?: () => void;
}

const GroupInfoView: React.FC<GroupInfoViewProps> = ({
  currentUserMapping,
  onMarkAsRead
}) => {
  const { user } = useAuthStore();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkGroupInfoAsRead = async () => {
    if (!currentUserMapping || !user?.auth_token || currentUserMapping.isGroupInfoRead) {
      onMarkAsRead?.();
      return;
    }

    setIsMarkingAsRead(true);
    setError(null);

    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation MyMutation($roomUserMappingId: uuid = "") {
              __typename
              update_whatsub_room_user_mapping(
                _set: { isGroupInfoRead: true }
                where: { id: { _eq: $roomUserMappingId } }
              ) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            roomUserMappingId: currentUserMapping.id
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setError('Failed to mark as read');
        console.error('Error marking group info as read:', data.errors);
        return;
      }

      if (data.data?.update_whatsub_room_user_mapping?.affected_rows > 0) {
        // Success - call the parent callback
        onMarkAsRead?.();
      } else {
        setError('Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking group info as read:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Info className="h-5 w-5 text-purple-400" />
        Group Information
      </h3>

      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <div className="flex items-start gap-3">
          <span className="text-indigo-400 font-bold text-lg flex-shrink-0">1.</span>
          <p>
            Please do not pay the admin directly outside of Subspace using Gpay, Paytm, Phonepe, or any other payment platform. In the event that the admin engages in fraudulent activity, we may be unable to assist you.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-indigo-400 font-bold text-lg flex-shrink-0">2.</span>
          <p>
            If for any reason you do not receive your credentials within 12 hours, you are entitled to a full refund.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-indigo-400 font-bold text-lg flex-shrink-0">3.</span>
          <p>
            You may request to leave the group at any time, provided that the admin has not revoked your access or credentials.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-indigo-400 font-bold text-lg flex-shrink-0">4.</span>
          <p>
            Please do not share your personal contact details with the admin, as this may result in unwanted spamming or fraud.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-indigo-400 font-bold text-lg flex-shrink-0">5.</span>
          <p>
            You will receive your credentials within 12 hours of joining the group.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Mark as Read Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={handleMarkGroupInfoAsRead}
          disabled={isMarkingAsRead || currentUserMapping?.isGroupInfoRead}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isMarkingAsRead ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Processing...
            </>
          ) : currentUserMapping?.isGroupInfoRead ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Already Read
            </>
          ) : (
            'I HAVE READ IT'
          )}
        </button>
      </div>
    </div>
  );
};

export default GroupInfoView;