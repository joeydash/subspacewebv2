import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import ConfirmationModal from '../ConfirmationModal';

interface QuickReply {
  id: string;
  message: string;
}

const QuickReplySettingsComponent: React.FC = () => {
  const { user } = useAuthStore();
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [newQuickReply, setNewQuickReply] = useState('');
  const [isLoadingQuickReplies, setIsLoadingQuickReplies] = useState(false);
  const [isSavingQuickReply, setIsSavingQuickReply] = useState(false);
  const [quickReplyToDelete, setQuickReplyToDelete] = useState<string | null>(null);
  const [isDeletingQuickReply, setIsDeletingQuickReply] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchQuickReplies = useCallback(async () => {
    if (!user?.id || !user?.auth_token) return;

    setIsLoadingQuickReplies(true);
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            query GetQuickReplies($user_id: uuid!) {
              __typename
              whatsub_quick_reply(where: {user_id: {_eq: $user_id}}) {
                __typename
                id
                message
              }
            }
          `,
          variables: {
            user_id: user.id
          }
        })
      });

      const data = await response.json();

      if (data.data?.whatsub_quick_reply) {
        setQuickReplies(data.data.whatsub_quick_reply);
      }
    } catch (error) {
      console.error('Error fetching quick replies:', error);
    } finally {
      setIsLoadingQuickReplies(false);
    }
  }, [user?.id, user?.auth_token]);

  useEffect(() => {
    if (user?.id && user?.auth_token) {
      fetchQuickReplies();
    }
  }, [user?.id, user?.auth_token, fetchQuickReplies]);

  const handleSaveQuickReply = async () => {
    if (!user?.id || !user?.auth_token || !newQuickReply.trim()) return;

    setIsSavingQuickReply(true);
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation InsertQuickReply($user_id: uuid!, $message: String!) {
              __typename
              insert_whatsub_quick_reply_one(object: {user_id: $user_id, message: $message}) {
                __typename
                id
                message
              }
            }
          `,
          variables: {
            user_id: user.id,
            message: newQuickReply.trim()
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('Error saving quick reply:', data.errors);
        return;
      }

      if (data.data?.insert_whatsub_quick_reply_one) {
        setQuickReplies([...quickReplies, data.data.insert_whatsub_quick_reply_one]);
        setNewQuickReply('');
      }
    } catch (error) {
      console.error('Error saving quick reply:', error);
    } finally {
      setIsSavingQuickReply(false);
    }
  };

  const handleDeleteQuickReply = async () => {
    if (!user?.auth_token || !quickReplyToDelete) return;

    setIsDeletingQuickReply(true);
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation DeleteQuickReply($id: uuid!) {
              __typename
              delete_whatsub_quick_reply_by_pk(id: $id) {
                __typename
                id
              }
            }
          `,
          variables: {
            id: quickReplyToDelete
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('Error deleting quick reply:', data.errors);
        return;
      }

      if (data.data?.delete_whatsub_quick_reply_by_pk) {
        setQuickReplies(quickReplies.filter(reply => reply.id !== quickReplyToDelete));
      }
    } catch (error) {
      console.error('Error deleting quick reply:', error);
    } finally {
      setIsDeletingQuickReply(false);
      setQuickReplyToDelete(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-white" />
          <span className="font-medium">Quick Reply</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
        )}
      </button>
      {isExpanded && (
        isLoadingQuickReplies ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading quick replies...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Set up quick replies for frequently sent messages
            </p>

            {/* Add Quick Reply */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuickReply}
                onChange={(e) => setNewQuickReply(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveQuickReply()}
                placeholder="Type a quick reply message..."
                className="flex-1 px-4 py-2 bg-dark-400 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSavingQuickReply}
              />
              <button
                onClick={handleSaveQuickReply}
                disabled={!newQuickReply.trim() || isSavingQuickReply}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSavingQuickReply ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Replies List */}
            {quickReplies.length === 0 ? (
              <div className="bg-dark-400 rounded-lg p-6 text-center">
                <MessageSquare className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No quick replies yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {quickReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className="flex items-center justify-between p-3 bg-dark-400 rounded-lg group"
                  >
                    <p className="text-white flex-1">{reply.message}</p>
                    <button
                      onClick={() => setQuickReplyToDelete(reply.id)}
                      className="ml-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Delete Confirmation Modal */}
      {quickReplyToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => !isDeletingQuickReply && setQuickReplyToDelete(null)}
          onConfirm={handleDeleteQuickReply}
          title="Delete Quick Reply"
          message="Are you sure you want to delete this quick reply?"
          confirmText="Delete"
        />
      )}
    </>
  );
};

export default QuickReplySettingsComponent;
