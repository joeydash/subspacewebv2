'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Send, AlertCircle, CheckCircle } from 'lucide-react';
import {useAuthStore} from '@/lib/store/auth-store';
import {useLanguageStore} from '@/lib/store/language-store';

interface AverageRating {
  average_rating: number;
  number_of_ratings: number;
}

interface AdminRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  adminId: string;
  adminImage?: string;
  currentRating?: number;
  totalRatings?: number;
  onSuccess?: () => void;
}

const AdminRatingModal: React.FC<AdminRatingModalProps> = ({
  isOpen,
  onClose,
  adminName,
  adminId,
  adminImage,
  currentRating = 0,
  totalRatings = 0,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [originalRating, setOriginalRating] = useState(0);
  const [originalComment, setOriginalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<AverageRating | null>(null);
  const [isLoadingRating, setIsLoadingRating] = useState(false);

  const MAX_COMMENT_LENGTH = 200;

  useEffect(() => {
    if (isOpen && user?.id && user?.auth_token && adminId) {
      fetchRatingData();
    }
  }, [isOpen, user?.id, user?.auth_token, adminId]);

  const fetchRatingData = async () => {
    if (!user?.id || !user?.auth_token || !adminId) return;
    
    setIsLoadingRating(true);
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            query getRating($user_id: uuid!, $from_user_id: uuid!) {
              whatsub_admin_ratings(
                where: { user_id: { _eq: $user_id }, from_user_id: { _eq: $from_user_id } }
              ) {
                rating
                review
              }

              whatsub_admin_average_ratings(
                where: { user_id: { _eq: $user_id } }
              ) {
                average_rating
                number_of_ratings
              }
            }
          `,
          variables: {
            user_id: adminId,
            from_user_id: user.id
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('Error fetching rating data:', data.errors);
        return;
      }
      
      // Set current rating and review if exists
      const currentRatingData = data.data?.whatsub_admin_ratings?.[0];
      if (currentRatingData) {
        setSelectedRating(currentRatingData.rating);
        setComment(currentRatingData.review || '');
        setOriginalRating(currentRatingData.rating);
        setOriginalComment(currentRatingData.review || '');
      }
      
      // Set average rating
      const averageRatingData = data.data?.whatsub_admin_average_ratings?.[0];
      if (averageRatingData) {
        setAverageRating({
          average_rating: averageRatingData.average_rating,
          number_of_ratings: averageRatingData.number_of_ratings
        });
      }
    } catch (error) {
      console.error('Error fetching rating data:', error);
    } finally {
      setIsLoadingRating(false);
    }
  };

  const hasChangedRating = () => {
    return selectedRating !== originalRating || comment.trim() !== originalComment.trim();
  };

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmitRating = async () => {
    if (!selectedRating || !user?.id || !user?.auth_token) {
      setError('Please select a rating');
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      setError(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`);
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
            mutation MyMutation($user_id: uuid, $review: String, $rating: Int, $from_user_id: uuid, $type: String) {
              __typename
              insert_whatsub_admin_ratings(
                objects: {
                  user_id: $user_id
                  from_user_id: $from_user_id
                  rating: $rating
                  review: $review
                  type: $type
                }
                on_conflict: {
                  constraint: whatsub_admin_rating_user_id_from_user_id_key
                  update_columns: [rating, review, type]
                }
              ) {
                __typename
                affected_rows
              }
            }
          `,
          variables: {
            user_id: adminId,
            from_user_id: user.id,
            rating: selectedRating,
            review: comment.trim() || null,
            type: 'user'
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors[0]?.message || 'Failed to submit rating');
        setSubmitStatus('failed');
        return;
      }

      if (data.data?.insert_whatsub_admin_ratings?.affected_rows > 0) {
        setSubmitStatus('success');
        // Auto close after 2 seconds on success
        setTimeout(() => {
          onSuccess?.();
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError('Failed to submit rating');
        setSubmitStatus('failed');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Network error. Please try again.');
      setSubmitStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRating(0);
    setHoveredRating(0);
    setComment('');
    setOriginalRating(0);
    setOriginalComment('');
    setSubmitStatus('idle');
    setError(null);
    setAverageRating(null);
  };

  const handleClose = () => {
    if (submitStatus === 'submitting') return; // Prevent closing during submission
    
    resetForm();
    onClose();
  };

  const remainingCharacters = MAX_COMMENT_LENGTH - comment.length;
  const isOverLimit = comment.length > MAX_COMMENT_LENGTH;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
                  {adminImage ? (
                    <img
                      src={adminImage}
                      alt={adminName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-base sm:text-lg font-bold">
                        {adminName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">{adminName}</h3>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                  <span>{averageRating?.average_rating} ({averageRating?.number_of_ratings})</span>
                </div>
              </div>
            </div>
            {submitStatus !== 'submitting' && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {submitStatus === 'idle' && (
            <>
              {/* Loading State */}
              {isLoadingRating && (
                <div className="text-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-sm sm:text-base text-gray-400">Loading rating data...</p>
                </div>
              )}

              {!isLoadingRating && (
                <>
                  <h4 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 text-center">
                    Share More About Your Experience
                  </h4>

                  {/* Star Rating */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleStarClick(star)}
                          onMouseEnter={() => handleStarHover(star)}
                          onMouseLeave={handleStarLeave}
                          className="transition-colors duration-200"
                        >
                          <Star
                            className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors ${
                              star <= (hoveredRating || selectedRating)
                                ? 'text-blue-400 fill-current'
                                : 'text-gray-600 hover:text-gray-500'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    
                  </div>

                  {/* Comment Input */}
                  <div className="mb-4 sm:mb-6">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Nice experience"
                      className={`w-full h-20 sm:h-24 bg-dark-400 text-sm sm:text-base text-white border rounded-lg px-3 sm:px-4 py-2 sm:py-3 resize-none focus:outline-none focus:ring-2 transition-all ${
                        isOverLimit 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-blue-500'
                      }`}
                      maxLength={MAX_COMMENT_LENGTH + 50} // Allow typing beyond limit for warning
                    />
                    <div className="flex justify-between items-center mt-1.5 sm:mt-2">
                      <div className={`text-xs sm:text-sm ${
                        isOverLimit ? 'text-red-400' : remainingCharacters < 20 ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        {remainingCharacters} characters remaining
                      </div>
                      <div className="text-xs text-gray-500">
                        {comment.length}/{MAX_COMMENT_LENGTH}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitRating}
                    disabled={!selectedRating || isSubmitting || !hasChangedRating()}
                    className="w-full py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-2 sm:gap-3"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    {originalRating > 0 ? 'Update Rating' : 'Post Rating'}
                  </button>

                  {error && (
                    <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm text-center">
                      {error}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {submitStatus === 'submitting' && (
            <div className="text-center py-6 sm:py-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-400"></div>
              </div>
              <h4 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2">Submitting Rating</h4>
              <p className="text-sm sm:text-base text-gray-400">Please wait while we save your rating...</p>
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="text-center py-6 sm:py-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" />
              </div>
              <h4 className="text-base sm:text-lg font-medium text-green-400 mb-1.5 sm:mb-2">Rating Submitted!</h4>
              <p className="text-sm sm:text-base text-gray-400">Thank you for your feedback</p>
            </div>
          )}

          {submitStatus === 'failed' && (
            <div className="text-center py-6 sm:py-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-400" />
              </div>
              <h4 className="text-base sm:text-lg font-medium text-red-400 mb-1.5 sm:mb-2">Rating Failed</h4>
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">{error || 'Unknown error occurred'}</p>
              <button
                onClick={handleSubmitRating}
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

export default AdminRatingModal;