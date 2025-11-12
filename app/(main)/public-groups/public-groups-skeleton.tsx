import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface PublicGroupCardSkeletonProps {
  count?: number;
}

export const PublicGroupCardSkeleton: React.FC<PublicGroupCardSkeletonProps> = ({ count = 12 }) => {
  return (
      <div className="max-h-[calc(100vh-24rem)] md:max-h-none overflow-y-auto md:overflow-y-visible pr-2 md:pr-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="bg-dark-500 rounded-xl overflow-hidden border border-gray-700/50"
            >
              {/* Header with Service Image */}
              <div className="relative h-28 md:h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <div className="absolute inset-0">
                  <Skeleton width="100%" height="100%" />
                </div>

                <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    {/* Service logo */}
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Skeleton width="100%" height="100%" className="rounded-lg" />
                    </div>
                    <div className="text-white flex flex-col min-w-0">
                      {/* Service name */}
                      <div className="mb-1">
                        <Skeleton width={100} height={16} className="md:w-[120px] md:h-[20px]" />
                      </div>
                      {/* Duration */}
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Skeleton circle width={12} height={12} className="md:w-4 md:h-4" />
                        <Skeleton width={60} height={12} className="md:w-20 md:h-[14px]" />
                      </div>
                    </div>
                  </div>
                  {/* Popularity badge */}
                  <div className="w-fit flex-shrink-0">
                    <Skeleton width={60} height={18} className="md:w-20 md:h-6 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-6">
                {/* Pricing */}
                <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5 md:gap-2 mb-1">
                      <Skeleton width={50} height={24} className="md:w-[60px] md:h-[28px]" />
                      <Skeleton width={70} height={12} className="md:w-20 md:h-4" />
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Skeleton width={60} height={12} className="md:w-20 md:h-[14px]" />
                      <span className="text-gray-600 hidden sm:inline">•</span>
                      <Skeleton width={50} height={12} className="md:w-[70px] md:h-[14px]" />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="mb-1">
                      <Skeleton width={40} height={12} className="md:w-[60px] md:h-4" />
                    </div>
                    <Skeleton width={30} height={20} className="md:w-10 md:h-6" />
                  </div>
                </div>

                {/* Availability Status */}
                <div className="p-2 md:p-3 rounded-lg mb-3 md:mb-4 bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Skeleton circle width={6} height={6} className="md:w-2 md:h-2" />
                    <Skeleton width={100} height={12} className="md:w-[120px] md:h-4" />
                  </div>
                </div>

                {/* Action Button */}
                <Skeleton height={40} className="md:h-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
  );
};

interface PublicGroupsFiltersSkeletonProps {
  showHeader?: boolean;
  showSearchAndFilters?: boolean;
}

export const PublicGroupsFiltersSkeleton: React.FC<PublicGroupsFiltersSkeletonProps> = ({ 
  showHeader = true, 
  showSearchAndFilters = true 
}) => {
  return (
      <div className="space-y-8">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton circle width={24} height={24} />
              <div>
                <Skeleton width={200} height={32} />
                <Skeleton width={300} height={16} />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-dark-500 rounded-lg p-2">
              <Skeleton circle width={20} height={20} />
              <Skeleton width={120} height={16} />
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {showSearchAndFilters && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-3xl">
                <Skeleton height={48} className="rounded-lg" />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width={60} height={16} />
                </div>
                <div className="flex gap-2">
                  <Skeleton width={50} height={40} className="rounded-lg" />
                  <Skeleton width={80} height={40} className="rounded-lg" />
                  <Skeleton width={70} height={40} className="rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

interface PublicGroupsSkeletonProps {
  showHeader?: boolean;
  showSearchAndFilters?: boolean;
  groupsCount?: number;
}

const PublicGroupsSkeleton: React.FC<PublicGroupsSkeletonProps> = ({ 
  showHeader = true, 
  showSearchAndFilters = true, 
  groupsCount = 12 
}) => {
  return (
    <div className="space-y-8">
      {/* Filters Skeleton */}
      <PublicGroupsFiltersSkeleton 
        showHeader={showHeader} 
        showSearchAndFilters={showSearchAndFilters} 
      />
      
      {/* Group Cards Skeleton */}
      <PublicGroupCardSkeleton count={groupsCount} />
    </div>
  );
};

export default PublicGroupsSkeleton;