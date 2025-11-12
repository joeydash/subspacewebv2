import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface FriendsSkeletonProps {
  count?: number;
}

const FriendsSkeleton: React.FC<FriendsSkeletonProps> = ({ count = 6 }) => {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-dark-500 rounded-xl p-1 sm:p-4 border border-gray-700/50 flex flex-col"
          >
            {/* Friend Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-shrink-0">
                {/* Main avatar */}
                <Skeleton circle width={56} height={56} />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Friend name */}
                <div className="mb-1">
                  <Skeleton width={100} height={16} />
                </div>
                {/* Phone number */}
                <Skeleton width={80} height={12} />
              </div>
            </div>

            {/* Subscriptions Preview - Fixed Height */}
            <div className="min-h-[60px] flex flex-col justify-center">
              {/* Subscription icons */}
              <div className="flex -space-x-2">
                {Array.from({ length: 5 }).map((_, subIndex) => (
                  <Skeleton
                    key={subIndex}
                    circle
                    width={32}
                    height={32}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              {/* Chat button */}
              <div className="flex-1">
                <Skeleton height={36} borderRadius={8} />
              </div>
              {/* Call button */}
              <div className="w-11">
                <Skeleton height={36} borderRadius={8} />
              </div>
            </div>
          </div>
        ))}
      </div>
  );
};

export default FriendsSkeleton;