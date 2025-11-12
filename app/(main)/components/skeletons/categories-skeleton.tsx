import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface CategoriesSkeletonProps {
  count?: number;
}

const CategoriesSkeleton: React.FC<CategoriesSkeletonProps> = ({ count = 8 }) => {
  return (
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex flex-col space-y-6 px-1" style={{ width: `${Math.ceil(count / 2) * (256 + 24)}px` }}>
            {/* First Row */}
            <div className="flex space-x-6">
              {Array.from({ length: Math.ceil(count / 2) }).map((_, index) => (
                <div
                  key={`row1-${index}`}
                  className="w-64 h-40 rounded-xl overflow-hidden relative"
                >
                  {/* Background skeleton */}
                  <Skeleton width={256} height={160} className="absolute inset-0" />
                  
                  {/* Content overlay skeletons */}
                  <div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
                    {/* Top right badge */}
                    <div className="flex justify-end">
                      <Skeleton width={80} height={24} className="rounded-full" />
                    </div>
                    
                    {/* Bottom content */}
                    <div className="flex flex-col items-end">
                      {/* Category name */}
                      <div className="mb-2">
                        <Skeleton width={120} height={20} />
                      </div>
                      
                      {/* Service images */}
                      <div className="flex -space-x-1">
                        {Array.from({ length: 4 }).map((_, imgIndex) => (
                          <Skeleton
                            key={imgIndex}
                            circle
                            width={32}
                            height={32}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Second Row */}
            <div className="flex space-x-6">
              {Array.from({ length: Math.floor(count / 2) }).map((_, index) => (
                <div
                  key={`row2-${index}`}
                  className="w-64 h-40 rounded-xl overflow-hidden relative"
                >
                  {/* Background skeleton */}
                  <Skeleton width={256} height={160} className="absolute inset-0" />
                  
                  {/* Content overlay skeletons */}
                  <div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
                    {/* Top right badge */}
                    <div className="flex justify-end">
                      <Skeleton width={80} height={24} className="rounded-full" />
                    </div>
                    
                    {/* Bottom content */}
                    <div className="flex flex-col items-end">
                      {/* Category name */}
                      <div className="mb-2">
                        <Skeleton width={120} height={20} />
                      </div>
                      
                      {/* Service images */}
                      <div className="flex -space-x-1">
                        {Array.from({ length: 4 }).map((_, imgIndex) => (
                          <Skeleton
                            key={imgIndex}
                            circle
                            width={32}
                            height={32}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default CategoriesSkeleton;