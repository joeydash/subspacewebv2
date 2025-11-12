'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface WelcomeMessageProps {
  groupId: string;
  onBack: () => void;
  onSave: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  groupId,
  onBack,
  onSave
}) => {
  const { user } = useAuthStore();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch welcome message when component mounts
  React.useEffect(() => {
    if (groupId && user?.auth_token) {
      fetchWelcomeMessage();
    }
  }, [groupId, user?.auth_token]);

  const fetchWelcomeMessage = async () => {
    if (!user?.auth_token || !groupId) return;
    
    setIsLoading(true);
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
            query getRoomWelcomeMessage($room_id: uuid!) {
              __typename
              whatsub_rooms(where: { id: { _eq: $room_id } }) {
                __typename
                welcome_message
              }
            }
          `,
          variables: {
            room_id: groupId
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        setError('Failed to fetch welcome message');
        return;
      }

      const room = data.data?.whatsub_rooms?.[0];
      if (room) {
        setWelcomeMessage(room.welcome_message || 'Hello, and welcome to my group! 😊\n🎉 I will be sharing the credentials with you very soon. 📧🔍');
      } else {
        setWelcomeMessage('Hello, and welcome to my group! 😊\n🎉 I will be sharing the credentials with you very soon. 📧🔍');
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error);
      setError('Failed to fetch welcome message');
      // Set default message on error
      setWelcomeMessage('Hello, and welcome to my group! 😊\n🎉 I will be sharing the credentials with you very soon. 📧🔍');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.auth_token || !groupId) return;
    
    setIsSaving(true);
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
            mutation UpdateWelcomeMessage($id: uuid!, $welcome_message: String) {
              __typename
              update_whatsub_rooms(
                where: { id: { _eq: $id } }
                _set: { welcome_message: $welcome_message }
              ) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            id: groupId,
            welcome_message: welcomeMessage.trim()
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        setError('Failed to save welcome message');
        return;
      }
      
      if (data.data?.update_whatsub_rooms?.affected_rows > 0) {
        onSave();
      } else {
        setError('Failed to save welcome message');
      }
    } catch (error) {
      console.error('Error saving welcome message:', error);
      setError('Failed to save welcome message');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-white">Welcome Message</h3>
        </div>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-bold text-white">Welcome Message</h3>
      </div>

      {/* Message Input */}
      <div>
        <textarea
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          placeholder="Enter your welcome message..."
          className="w-full h-48 bg-dark-400 text-white border border-gray-600 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-400">
            {500 - welcomeMessage.length} characters remaining
          </div>
          <div className="text-xs text-gray-500">
            {welcomeMessage.length}/500
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !welcomeMessage.trim()}
        className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save
          </>
        )}
      </button>
    </div>
  );
};

export default WelcomeMessage;