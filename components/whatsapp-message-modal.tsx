'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLanguageStore } from '@/lib/store/language-store';

interface WhatsAppMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendId: string;
}

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  isOpen,
  onClose,
  friendName,
  friendId
}) => {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const MAX_CHARACTERS = 512;
  const MESSAGE_COST = 0.14;

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id || !user?.auth_token) return;
    
    if (message.length > MAX_CHARACTERS) {
      setError(`Message cannot exceed ${MAX_CHARACTERS} characters`);
      return;
    }
    
    setIsSending(true);
    setSendStatus('sending');
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
            mutation sendWhatsappMessage($user_id: uuid!, $username: String!, $message: String!) {
              __typename
              whatsubSendMessageFromUser(request: {user_id: $user_id, username: $username, message: $message}) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            user_id: user.id,
            username: friendId,
            message: message.trim()
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0]?.message || 'Failed to send WhatsApp message');
        setSendStatus('failed');
        return;
      }

      if (data.data?.whatsubSendMessageFromUser?.affected_rows > 0) {
        setSendStatus('success');
        setMessage('');
        // Auto close after 2 seconds on success
        setTimeout(() => {
          onClose();
          setSendStatus('idle');
        }, 2000);
      } else {
        setError('Failed to send WhatsApp message');
        setSendStatus('failed');
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      setError('Network error. Please try again.');
      setSendStatus('failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (sendStatus === 'sending') return; // Prevent closing during sending
    
    setSendStatus('idle');
    setError(null);
    setMessage('');
    onClose();
  };

  const remainingCharacters = MAX_CHARACTERS - message.length;
  const isOverLimit = message.length > MAX_CHARACTERS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md relative border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Send WhatsApp Message</h3>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
          </div>
          {sendStatus !== 'sending' && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {sendStatus === 'idle' && (
            <>
              {/* Cost Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Message Pricing</span>
                </div>
                <p className="text-white font-bold">Each message will cost you ₹{MESSAGE_COST} and is limited to {MAX_CHARACTERS} characters</p>
              </div>

              {/* Message Input */}
              <div className="mb-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className={`w-full h-32 bg-dark-400 text-white border rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 transition-all ${
                    isOverLimit 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-indigo-500'
                  }`}
                  maxLength={MAX_CHARACTERS + 50} // Allow typing beyond limit for warning
                />
                <div className="flex justify-between items-center mt-2">
                  <div className={`text-sm ${
                    isOverLimit ? 'text-red-400' : remainingCharacters < 50 ? 'text-orange-400' : 'text-gray-400'
                  }`}>
                    {remainingCharacters} characters remaining
                  </div>
                  <div className="text-xs text-gray-500">
                    {message.length}/{MAX_CHARACTERS}
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isOverLimit || isSending}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
              >
                {isSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Sending Message...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </>
          )}

          {sendStatus === 'sending' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400"></div>
              </div>
              <h4 className="text-lg font-medium mb-2">Sending Message</h4>
              <p className="text-gray-400">Sending WhatsApp message to {friendName}...</p>
            </div>
          )}

          {sendStatus === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h4 className="text-lg font-medium text-green-400 mb-2">Message Sent!</h4>
              <p className="text-gray-400">Your WhatsApp message has been sent to {friendName}</p>
            </div>
          )}

          {sendStatus === 'failed' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h4 className="text-lg font-medium text-red-400 mb-2">Message Failed</h4>
              <p className="text-gray-400 mb-4">{error || 'Unknown error occurred'}</p>
              <button
                onClick={handleSendMessage}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {sendStatus === 'idle' && (
          <div className="px-6 pb-6">
            <div className="bg-dark-400 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <AlertCircle className="h-4 w-4" />
                <span>Standard WhatsApp messaging rates apply</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessageModal;