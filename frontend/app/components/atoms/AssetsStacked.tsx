import type React from 'react';
import { twMerge } from '~/utils/twMerge';

interface Asset {
  symbol: string;
  logoURI: string;
}

interface Props {
  assets: Asset[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AssetsStacked: React.FC<Props> = ({ assets, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const offsetClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  return (
    <div className={twMerge('flex items-center', className)}>
      {assets.map((asset, index) => (
        <div
          key={index}
          className={twMerge('relative rounded-full border-2 border-tw-bg bg-tw-bg overflow-hidden', sizeClasses[size], index > 0 && offsetClasses[size])}
          style={{ zIndex: assets.length - index }}
        >
          <img
            src="/assets/default.png"
            // alt={asset.symbol}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a default token icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = '/assets/default.png';
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default AssetsStacked;
