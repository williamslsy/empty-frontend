'use client';

import { useNetworkStatus } from '~/app/hooks/useNetworkStatus';
import { Button } from '../atoms/Button';
import { IconAlertTriangle, IconNetwork } from '@tabler/icons-react';
import { twMerge } from '~/utils/twMerge';

interface NetworkAlertProps {
  className?: string;
  showWhenCorrect?: boolean;
}

export const NetworkAlert: React.FC<NetworkAlertProps> = ({ className, showWhenCorrect = false }) => {
  const { isConnected, isOnSepolia, isWrongNetwork, switchToSepolia, currentChainId, sepoliaChainId } = useNetworkStatus();

  if (!isConnected) return null;

  if (isOnSepolia && showWhenCorrect) {
    return (
      <div className={twMerge('flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <IconNetwork className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">Connected to Sepolia</p>
            <p className="text-green-400/70 text-sm">You're on the correct network</p>
          </div>
        </div>
      </div>
    );
  }

  if (isOnSepolia) return null;

  if (isWrongNetwork) {
    return (
      <div className={twMerge('flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <IconAlertTriangle className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-orange-400 font-medium">Wrong Network</p>
            <p className="text-orange-400/70 text-sm">Please switch to Sepolia testnet to interact with this dapp</p>
          </div>
        </div>
        <Button variant="flat" size="sm" onPress={switchToSepolia} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30">
          Switch to Sepolia
        </Button>
      </div>
    );
  }

  return null;
};
