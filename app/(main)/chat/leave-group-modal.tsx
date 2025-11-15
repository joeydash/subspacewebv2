'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onSuccess?: () => void;
}

const LeaveGroupModal: React.FC<LeaveGroupModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const MAX_REASON_LENGTH = 500;

  const handleSubmitRequest = async () => {
    if (!user?.id || !user?.auth_token || !groupId) return;
    
    if (!reason.trim()) {
      setError('Please provide a reason for leaving the group');
      return;
    }

    if (reason.length > MAX_REASON_LENGTH) {
      setError(`Reason cannot exceed ${MAX_REASON_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('submitting');
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
            mutation MyMutation($user_id: uuid, $room_id: uuid, $leave_request_reason: String) {
              __typename
              update_whatsub_room_user_mapping(
                where: { user_id: { _eq: $user_id }, room_id: { _eq: $room_id } }
                _set: { leave_request: true, leave_request_reason: $leave_request_reason }
              ) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            user_id: user.id,
            room_id: groupId,
            leave_request_reason: reason.trim()
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0]?.message || 'Failed to submit leave request');
        setSubmitStatus('failed');
        return;
      }

      if (data.data?.update_whatsub_room_user_mapping?.affected_rows > 0) {
        setSubmitStatus('success');
        // Auto close after 2 seconds on success
        setTimeout(() => {
          onSuccess?.();
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError('Failed to submit leave request');
        setSubmitStatus('failed');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError('Network error. Please try again.');
      setSubmitStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setSubmitStatus('idle');
    setError(null);
  };

  const handleClose = () => {
    if (submitStatus === 'submitting') return; // Prevent closing during submission
    
    resetForm();
    onClose();
  };

  const remainingCharacters = MAX_REASON_LENGTH - reason.length;
  const isOverLimit = reason.length > MAX_REASON_LENGTH;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-80 p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header with colored bar */}
        <div className="relative">
          <div className="h-2 bg-linear-to-r from-indigo-500 to-purple-500 rounded-t-2xl"></div>
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Reason for leaving the group?</h3>
              {submitStatus !== 'submitting' && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitStatus === 'idle' && (
            <>
              {/* Reason Input */}
              <div className="mb-6">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Write Reason"
                  className={`w-full h-32 bg-dark-400 text-white border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                    isOverLimit 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-indigo-500'
                  }`}
                  maxLength={MAX_REASON_LENGTH + 50} // Allow typing beyond limit for warning
                />
                <div className="flex justify-between items-center mt-2">
                  <div className={`text-sm ${
                    isOverLimit ? 'text-red-400' : remainingCharacters < 50 ? 'text-orange-400' : 'text-gray-400'
                  }`}>
                    {remainingCharacters} characters remaining
                  </div>
                  <div className="text-xs text-gray-500">
                    {reason.length}/{MAX_REASON_LENGTH}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Please take note that your request will only be considered if you are having trouble accessing the subscription.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitRequest}
                disabled={!reason.trim() || isSubmitting || isOverLimit}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2 inline-block"></div>
                    Submitting...
                  </>
                ) : (
                  'Request'
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
            </>
          )}

          {submitStatus === 'submitting' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-400"></div>
              </div>
              <h4 className="text-lg font-medium mb-2">Submitting Request</h4>
              <p className="text-gray-400">Please wait while we process your leave request...</p>
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h4 className="text-lg font-medium text-green-400 mb-2">Request Submitted!</h4>
              <p className="text-gray-400">Your leave request has been submitted and will be reviewed by the admin.</p>
            </div>
          )}

          {submitStatus === 'failed' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h4 className="text-lg font-medium text-red-400 mb-2">Request Failed</h4>
              <p className="text-gray-400 mb-4">{error || 'Unknown error occurred'}</p>
              <button
                onClick={handleSubmitRequest}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveGroupModal;