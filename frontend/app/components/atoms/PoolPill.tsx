import { Tooltip } from '@heroui/react';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import type { PoolIncentive, PoolInfo } from '@towerfi/types';
import type React from 'react';
import { Assets } from '~/config/assets';
import { convertMicroDenomToDenom } from '~/utils/intl';
import { twMerge } from '~/utils/twMerge';

interface PillProps {
  children: React.ReactNode;
  className?: string;
}

const Pill: React.FC<PillProps> = ({ children, className }) => {
  return <span className={twMerge('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70', className)}>{children}</span>;
};

interface PoolTypePillProps {
  poolType: string;
  config: any;
}

export const getPoolTypeDescription = (poolType: string, params?: PoolInfo['config']['params']) => {
  if (poolType === 'concentrated') {
    if (!params) return 'PCL';

    const amp = params.amp;
    const gamma = params.gamma;

    if (amp && gamma) {
      if (amp === '12') {
        return 'PCL Wide';
      }
      if (amp === '75') {
        return 'PCL Narrow';
      }
      if (amp === '950') {
        return 'PCL Correlated';
      }
      return `PCL Custom ${amp}/${gamma}`;
    }

    return 'PCL';
  }

  return poolType.toUpperCase();
};

export const PoolTypePill: React.FC<PoolTypePillProps> = ({ poolType }) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'concentrated':
        return 'Concentrated';
      case 'stable':
        return 'Stable';
      case 'weighted':
        return 'Weighted';
      default:
        return type;
    }
  };

  return <Pill className="bg-tw-blue-500/20 text-tw-blue-400">{getTypeLabel(poolType)}</Pill>;
};

interface PoolFeePillProps {
  poolType: string;
  config: any;
}

export const PoolFeePill: React.FC<PoolFeePillProps> = ({ config }) => {
  return <Pill className="bg-tw-orange-500/20 text-tw-orange-400">{config?.fee || '0.30%'}</Pill>;
};

interface PoolIncentivesPillProps {
  incentives?: any;
}

export const PoolIncentivesPill: React.FC<PoolIncentivesPillProps> = ({ incentives }) => {
  if (!incentives) return null;

  return <Pill className="bg-tw-green-500/20 text-tw-green-400">Incentivized</Pill>;
};

// export const PoolIncentivesPill: React.FC<{
//   incentives: PoolIncentive | undefined;
//   className?: string;
// }> = ({ incentives, className }) => {
//   const tooltipContent = (
//     <div className="flex flex-col gap-3 p-2">
//       <div className="flex items-center gap-2">
//         <div className="text-tw-orange-400 font-medium">Incentives</div>
//         <a href="https://docs.tower.fi/incentive-campaigns" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
//           View campaigns
//         </a>
//       </div>
//       {incentives && (
//         <div className="flex flex-col gap-2">
//           <div className="text-sm text-white/50">Current Campaigns:</div>
//           <div className="flex flex-col gap-1">
//             <div className="flex justify-between items-center text-sm">
//               <span className="text-white/80">${Assets[incentives.reward_token]?.symbol || incentives.reward_token.toUpperCase()}</span>
//               <span className="text-white/80 ml-2">
//                 {convertMicroDenomToDenom(
//                   Number(incentives.rewards_per_second) * 60 * 60 * 24, // Convert to daily
//                   incentives.token_decimals,
//                   incentives.token_decimals,
//                   true
//                 )}
//                 /day
//               </span>
//             </div>
//             <div className="text-xs text-white/50">
//               {new Date(Number(incentives.start_ts) * 1000).toLocaleDateString('en-US', {
//                 day: 'numeric',
//                 month: 'short',
//               })}{' '}
//               →{' '}
//               {new Date(Number(incentives.end_ts) * 1000).toLocaleDateString('en-US', {
//                 day: 'numeric',
//                 month: 'short',
//               })}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className={twMerge('flex items-center gap-2', className)}>
//       {!!incentives && (
//         <Pill color="yellow">
//           <Tooltip content={tooltipContent}>
//             <div className="flex items-center gap-1">
//               Incentivized
//               <IconInfoCircleFilled className="w-4 h-4" />
//             </div>
//           </Tooltip>
//         </Pill>
//       )}
//     </div>
//   );
// };
