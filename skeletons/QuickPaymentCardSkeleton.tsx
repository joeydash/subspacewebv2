import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface QuickPaymentCardSkeletonProps {
  count?: number;
}

const QuickPaymentCardSkeleton: React.FC<QuickPaymentCardSkeletonProps> = ({ count = 12 }) => {
  return (
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-4 px-1">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className="flex-none w-36 bg-transparent rounded-xl px-2 border border-gray-700/50"
              >
                <div className="flex flex-col items-center mb-4">
                  {/* Icon skeleton */}
                  <div className="w-16 h-16 mx-2 mb-1 rounded-lg overflow-hidden bg-transparent p-1">
                    <Skeleton width={56} height={56} className="rounded-lg" />
                  </div>
                  
                  {/* Service name skeleton */}
                  <div className="mb-1 w-full">
                    <Skeleton width={100} height={14} />
                  </div>
                  
                  {/* Discount text skeleton */}
                  <div className="w-full flex justify-center">
                    <Skeleton width={60} height={12} className="rounded-full" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
  );
};

export default QuickPaymentCardSkeleton;