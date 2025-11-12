'use client';

import React, { useState } from 'react';
import { X, UserX, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface RemoveMemberConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberId: string;
  groupId: string;
  onSuccess?: () => void;
}

const RemoveMemberConfirmationModal: React.FC<RemoveMemberConfirmationModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberId,
  groupId,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveMember = async () => {
    if (!user?.auth_token || !groupId || !memberId) return;
    
    setIsRemoving(true);
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
            mutation MyMutation(
              $remove_user_id: uuid = ""
              $room_id: uuid = ""
              $user_id: uuid = ""
            ) {
              __typename
              whatsubRemoveMember(
                request: {
                  remove_user_id: $remove_user_id
                  room_id: $room_id
                  user_id: $user_id
                }
              ) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            remove_user_id: memberId,
            room_id: groupId,
            user_id: user.id
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        setError(data.errors[0]?.message || 'Failed to remove member');
        return;
      }
      
      if (data.data?.whatsubRemoveMember?.affected_rows > 0) {
        onSuccess?.();
        onClose();
      } else {
        setError('Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-3 sm:p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white">Remove Member</h3>
            {!isRemoving && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <UserX className="h-7 w-7 sm:h-8 sm:w-8 text-red-400" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Remove {memberName}?</h4>
            <p className="text-sm sm:text-base text-gray-400">
              This action will remove {memberName} from the group. They will lose access to the shared subscription.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">Warning</p>
                <p className="text-gray-300 text-xs sm:text-sm">
                  This action cannot be undone. The member will be notified about their removal from the group.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={isRemoving}
              className="flex-1 py-2.5 sm:py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white text-sm sm:text-base rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="flex-1 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-600 text-white text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {isRemoving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white"></div>
                  Removing...
                </>
              ) : (
                <>
                  Remove
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberConfirmationModal;