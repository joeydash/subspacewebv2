import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface QuickPaymentsSkeletonProps {
  categories?: number; // number of categories
  itemsPerCategory?: number; // number of items per category
}

const QuickPaymentsSkeleton: React.FC<QuickPaymentsSkeletonProps> = ({
  categories = 2,
  itemsPerCategory = 6,
}) => {
  return (
      <div className="space-y-10">
        {Array.from({ length: categories }).map((_, catIndex) => (
          <div key={catIndex}>
            {/* Category Title */}
            <div className="flex items-center gap-3 mb-6">
              <Skeleton circle width={32} height={32} />
              <Skeleton width={150} height={24} />
              <Skeleton width={40} height={20} />
            </div>

            {/* Grid of Options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: itemsPerCategory }).map((_, index) => (
                <div
                  key={index}
                  className="bg-dark-500 rounded-xl p-4 border border-gray-700/50"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-lg flex items-center justify-center">
                    <Skeleton width={48} height={48} />
                  </div>
                  <div className="text-center space-y-2">
                    <Skeleton width="70%" height={16} className="mx-auto" />
                    <Skeleton
                      width="50%"
                      height={14}
                      className="mx-auto rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
  );
};

export default QuickPaymentsSkeleton;
