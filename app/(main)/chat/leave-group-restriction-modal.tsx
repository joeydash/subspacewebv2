import React from 'react';
import { X, Clock } from 'lucide-react';

interface LeaveGroupRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hoursRemaining: number;
}

const LeaveGroupRestrictionModal: React.FC<LeaveGroupRestrictionModalProps> = ({
  isOpen,
  onClose,
  hoursRemaining
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white">Cannot Leave Yet</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              You need to stay in this group for at least <span className="font-semibold text-white">6 hours</span> before you can leave.
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-yellow-400 text-xs sm:text-sm">
                Time remaining: <span className="font-bold">{hoursRemaining.toFixed(1)} hours</span>
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-400">
              This policy helps maintain group stability and ensures fair participation for all members.
            </p>
          </div>

          <div className="mt-4 sm:mt-6">
            <button
              onClick={onClose}
              className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base rounded-lg transition-colors font-medium"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveGroupRestrictionModal;
