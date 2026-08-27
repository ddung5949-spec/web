import React from 'react';

export const ShimmerBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const ArticleCardSkeleton: React.FC = () => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3.5 items-start">
    <ShimmerBox className="w-full sm:w-44 h-28 rounded-lg shrink-0" />
    <div className="flex-1 w-full space-y-2.5 py-1">
      <div className="flex items-center gap-2">
        <ShimmerBox className="w-20 h-4 rounded" />
        <ShimmerBox className="w-24 h-4 rounded" />
      </div>
      <ShimmerBox className="w-11/12 h-5 rounded" />
      <ShimmerBox className="w-full h-3.5 rounded" />
      <ShimmerBox className="w-4/5 h-3.5 rounded" />
      <div className="flex items-center justify-between pt-1">
        <ShimmerBox className="w-16 h-3 rounded" />
        <ShimmerBox className="w-20 h-3 rounded" />
      </div>
    </div>
  </div>
);

export const SpotlightSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
    <div className="bg-red-900/40 px-4 py-3 flex items-center justify-between">
      <ShimmerBox className="w-40 h-4 bg-red-800/60 rounded" />
      <ShimmerBox className="w-20 h-4 bg-red-800/60 rounded" />
    </div>
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
        <ShimmerBox className="md:col-span-5 h-40 rounded-lg" />
        <div className="md:col-span-7 space-y-2.5 flex flex-col justify-between py-1">
          <div className="space-y-2">
            <ShimmerBox className="w-24 h-4 rounded" />
            <ShimmerBox className="w-full h-5 rounded" />
            <ShimmerBox className="w-5/6 h-3.5 rounded" />
            <ShimmerBox className="w-4/6 h-3.5 rounded" />
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <ShimmerBox className="w-28 h-3.5 rounded" />
            <ShimmerBox className="w-16 h-3.5 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {[1, 2].map((i) => (
          <div key={i} className="p-2.5 rounded-xl border border-gray-200 flex items-start gap-2.5">
            <ShimmerBox className="w-16 h-14 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5 py-0.5">
              <ShimmerBox className="w-full h-3.5 rounded" />
              <ShimmerBox className="w-3/4 h-3 rounded" />
              <ShimmerBox className="w-1/2 h-2.5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SliderSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden relative min-h-[340px] flex flex-col justify-between">
    <div className="p-3 flex justify-between">
      <ShimmerBox className="w-28 h-5 rounded" />
    </div>
    <div className="p-5 space-y-3 mt-auto bg-gradient-to-t from-gray-300 via-gray-200 to-transparent pt-16">
      <ShimmerBox className="w-3/4 h-6 rounded" />
      <ShimmerBox className="w-full h-4 rounded" />
      <div className="flex justify-between pt-2">
        <ShimmerBox className="w-32 h-3.5 rounded" />
        <ShimmerBox className="w-20 h-3.5 rounded" />
      </div>
    </div>
  </div>
);

export const LatestNewsSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col justify-between min-h-[340px]">
    <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
      <ShimmerBox className="w-28 h-4 rounded" />
      <ShimmerBox className="w-16 h-3 rounded" />
    </div>
    <div className="p-3 divide-y divide-gray-100 flex-1 flex flex-col justify-around space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="py-1.5 space-y-1.5">
          <ShimmerBox className="w-full h-3.5 rounded" />
          <div className="flex items-center gap-2">
            <ShimmerBox className="w-16 h-2.5 rounded" />
            <ShimmerBox className="w-20 h-2.5 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AnnouncementsSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden flex flex-col justify-between">
    <div className="bg-amber-700/60 px-3.5 py-2.5 flex items-center justify-between">
      <ShimmerBox className="w-44 h-4 bg-amber-800/80 rounded" />
    </div>
    <div className="p-2.5 space-y-2 bg-amber-50/40">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-2.5 rounded-xl bg-white border border-amber-200/90 flex items-start gap-2.5">
          <ShimmerBox className="w-5 h-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <ShimmerBox className="w-full h-3.5 rounded" />
            <ShimmerBox className="w-2/3 h-3 rounded" />
            <ShimmerBox className="w-24 h-2.5 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const UncleHoSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border-2 border-red-700 shadow-sm overflow-hidden flex flex-col justify-between">
    <div className="bg-red-800 px-3.5 py-2.5 flex items-center justify-between">
      <ShimmerBox className="w-36 h-4 bg-red-700 rounded" />
      <ShimmerBox className="w-16 h-4 bg-red-700 rounded" />
    </div>
    <div className="p-4 space-y-3 bg-red-50/20">
      <ShimmerBox className="w-full h-36 rounded-xl" />
      <ShimmerBox className="w-32 h-4 rounded mx-auto" />
      <ShimmerBox className="w-full h-4 rounded" />
      <ShimmerBox className="w-4/5 h-4 rounded mx-auto" />
    </div>
  </div>
);
