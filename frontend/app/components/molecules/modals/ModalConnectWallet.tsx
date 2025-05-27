import BasicModal from '~/app/components/templates/BasicModal';
import { Button } from '~/app/components/atoms/Button';
import Image from 'next/image';
import { useModal } from '~/app/providers/ModalProvider';
import { useToast } from '~/app/hooks';
import { useConnect, useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';

import type React from 'react';
import { useEffect, useState } from 'react';

function ConnectorButton({ connector, onClick }: { connector: any; onClick: () => void }) {
  const { name, ready, id } = connector;

  const getWalletIcon = (connector: any) => {
    try {
      if (connector?.icon) {
        const cleanIcon = connector.icon.replace(/^\s+|\s+$/g, '').trim();
        if (cleanIcon.startsWith('data:image/')) {
          return cleanIcon;
        }
      }
      return '/assets/default.png';
    } catch (error) {
      console.warn('Error processing wallet icon:', error);
      return '/assets/default.png';
    }
  };

  const githubIcon = `https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/${id}.webp`;
  const fallbackIcon = getWalletIcon(connector);
  const [currentIcon, setCurrentIcon] = useState(githubIcon);

  return (
    <Button radius="lg" variant="faded" disabled={!ready} onPress={onClick} type="button" className="flex flex-col p-2 h-fit group overflow-hidden cursor-pointer">
      <div className="h-12 w-12 p-1 relative">
        <Image
          className="w-full h-full rounded-full object-contain relative z-10"
          src={currentIcon}
          width={40}
          height={40}
          alt={`wallet-${name}`}
          priority
          onError={() => {
            console.warn('GitHub icon failed, using fallback:', githubIcon);
            setCurrentIcon(fallbackIcon);
          }}
        />
        <span className="bg-tw-orange-400 h-4 w-4 absolute rounded-full top-4 left-4 z-0 group-hover:scale-[13] transition-all duration-400" />
      </div>
      <p className="relative z-10 text-white group-hover:text-tw-bg transition-all duration-400">{name}</p>
    </Button>
  );
}

const ModalConnectWallet: React.FC = () => {
  const { connectors, connect, error } = useConnect();
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { hideModal } = useModal();

  useEffect(() => {
    if (isConnected) hideModal();
  }, [isConnected, hideModal]);

  useEffect(() => {
    if (error) {
      toast.error({
        title: 'Connection Error',
        description: error.message,
      });
    }
  }, [error, toast]);

  const availableConnectors = connectors.filter((connector) => {
    return connector && connector.name && connector.type;
  });

  return (
    <BasicModal title="Connect Wallet" classNames={{ wrapper: 'max-w-sm' }}>
      <div className="grid grid-cols-2 gap-3">
        {availableConnectors.length > 0 ? (
          availableConnectors.map((connector) => <ConnectorButton key={connector.uid} connector={connector} onClick={() => connect({ connector, chainId: sepolia.id })} />)
        ) : (
          <div className="col-span-2 text-center py-4">
            <p className="text-white/60">No wallets detected</p>
            <p className="text-white/40 text-sm mt-2">Please install MetaMask or another Web3 wallet</p>
          </div>
        )}
      </div>
    </BasicModal>
  );
};

export default ModalConnectWallet;
