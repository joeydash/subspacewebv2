import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface CarouselSkeletonProps {
  count?: number;
}

const CarouselSkeleton: React.FC<CarouselSkeletonProps> = ({ count = 3 }) => {
  return (
      <div className="mb-12">
        <div className="relative h-48 xs:h-80 md:h-52 lg:h-[16rem] overflow-hidden">
          <div className="flex items-center justify-center h-full relative">
            {/* Center slide (main) */}
            <div className="z-30 scale-100 opacity-100">
              <div className="w-80 h-40 md:w-96 md:h-48 lg:w-[28rem] lg:h-56 rounded-2xl overflow-hidden shadow-2xl">
                <Skeleton width="100%" height="100%" className="rounded-2xl" />
              </div>
            </div>
            
            {/* Left side slide */}
            <div className="absolute z-20 scale-75 opacity-60 hidden md:block" style={{ transform: 'translateX(-280px) scale(0.75)' }}>
              <div className="w-80 h-40 md:w-96 md:h-48 lg:w-[28rem] lg:h-56 rounded-2xl overflow-hidden shadow-xl filter blur-sm">
                <Skeleton width="100%" height="100%" className="rounded-2xl" />
              </div>
            </div>
            
            {/* Right side slide */}
            <div className="absolute z-20 scale-75 opacity-60 hidden md:block" style={{ transform: 'translateX(280px) scale(0.75)' }}>
              <div className="w-80 h-40 md:w-96 md:h-48 lg:w-[28rem] lg:h-56 rounded-2xl overflow-hidden shadow-xl filter blur-sm">
                <Skeleton width="100%" height="100%" className="rounded-2xl" />
              </div>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <div className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full">
            <Skeleton circle width="100%" height="100%" />
          </div>
          
          <div className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-full">
            <Skeleton circle width="100%" height="100%" />
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center items-center space-x-2 md:space-x-3 mt-4 md:mt-6">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className={`rounded-full ${index === 0 ? 'w-6 h-2 md:w-8 md:h-3' : 'w-2 h-2 md:w-3 md:h-3'}`}>
              <Skeleton 
                width="100%" 
                height="100%" 
                className="rounded-full" 
              />
            </div>
          ))}
        </div>
      </div>
  );
};

export default CarouselSkeleton;