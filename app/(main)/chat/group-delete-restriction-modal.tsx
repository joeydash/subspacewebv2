import React from 'react';
import { X, Users, Shield } from 'lucide-react';

interface GroupDeleteRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  memberCount: number;
}

const GroupDeleteRestrictionModal: React.FC<GroupDeleteRestrictionModalProps> = ({
  isOpen,
  onClose,
  groupName,
  memberCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-3 sm:p-4">
      <div className="bg-dark-500 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-xl font-bold text-white">Cannot Delete Group</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-7 w-7 sm:h-8 sm:w-8 text-orange-400" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">Group Has Active Members</h4>
            <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
              You cannot delete "{groupName}" because it has {memberCount} active {memberCount === 1 ? 'member' : 'members'}.
            </p>
          </div>

          {/* Info Section */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">What you can do:</p>
                <ul className="text-gray-300 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                  <li>• Remove all members first, then delete the group</li>
                  <li>• Wait for members to leave naturally</li>
                  <li>• Transfer admin rights to another member</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm sm:text-base font-bold rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDeleteRestrictionModal;