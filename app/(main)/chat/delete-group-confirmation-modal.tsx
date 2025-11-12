import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface DeleteGroupConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  subscriptionId: string;
  groupName: string;
  onSuccess?: () => void;
}

const DeleteGroupConfirmationModal: React.FC<DeleteGroupConfirmationModalProps> = ({
  isOpen,
  onClose,
  groupId,
  subscriptionId,
  groupName,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [isDeletingGroup, setIsDeletingGroup] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleDeleteGroup = async () => {
    if (!user?.id || !user?.auth_token || !groupId) return;
    
    setIsDeletingGroup(true);
    setDeleteError(null);
    
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation MyMutation($user_subscription_id: uuid, $room_id: uuid) {
              __typename
              update_whatsub_users_subscription(
                where: { id: { _eq: $user_subscription_id } }
                _set: { status: "inactive" }
              ) {
                __typename
                affected_rows
              }
              update_whatsub_rooms(
                where: { id: { _eq: $room_id } }
                _set: { status: "inactive", is_public: false }
              ) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            room_id: groupId,
            user_subscription_id: subscriptionId
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        setDeleteError(data.errors[0]?.message || 'Failed to delete group');
        return;
      }
      
      if (data.data?.update_whatsub_users_subscription?.affected_rows > 0 && 
          data.data?.update_whatsub_rooms?.affected_rows > 0) {
        // Successfully deleted group
        onSuccess?.();
        onClose();
      } else {
        setDeleteError('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setDeleteError('Network error. Please try again.');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-3 sm:p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white">Delete Group</h3>
            {!isDeletingGroup && (
              <button
                onClick={handleCancelDelete}
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
              <Trash2 className="h-7 w-7 sm:h-8 sm:w-8 text-red-400" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Are you sure?</h4>
            <p className="text-sm sm:text-base text-gray-400">
              This action cannot be undone. Deleting the group will remove all members and chat history permanently.
            </p>
          </div>

          {deleteError && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm">
              {deleteError}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleCancelDelete}
              disabled={isDeletingGroup}
              className="flex-1 py-2.5 sm:py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white text-sm sm:text-base rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
              className="flex-1 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-600 text-white text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {isDeletingGroup ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                'Delete Group'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupConfirmationModal;