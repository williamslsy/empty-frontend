import Skeleton from './Skeleton';

const UserPositionSkeleton: React.FC = () => {
  return (
    <div className="border border-white/10 p-6 rounded-xl">
      {/* Header Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Skeleton className="h-4 w-20" />
        <div className="flex justify-center">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-3 gap-6 items-center">
        {/* Total Value */}
        <div>
          <Skeleton className="h-8 w-24 mb-1" />
        </div>

        {/* Claimable Incentives */}
        <div className="flex justify-center">
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default UserPositionSkeleton;
