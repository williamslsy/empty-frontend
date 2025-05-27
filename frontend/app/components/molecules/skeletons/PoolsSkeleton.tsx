import type React from 'react';
import Skeleton from '../../atoms/Skeleton';
import { twMerge } from '~/utils/twMerge';

interface Props {
  className?: string;
}

const PoolsSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={twMerge('py-4 px-4', className)}>
          <div className="col-span-2 lg:col-span-1 flex items-center gap-3">
            <div className="flex -space-x-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-1">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg ml-auto" />
        </div>
      ))}
    </>
  );
};

export default PoolsSkeleton;
