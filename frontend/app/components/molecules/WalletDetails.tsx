import CopyMessage from "../atoms/CopyMessage";
import { IconCopy, IconLogout } from "@tabler/icons-react";
import { Button } from "../atoms/Button";

// Format address for display
const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface WalletDetailsProps {
  address: string;
  chainName?: string;
  walletName?: string;
  walletIcon?: string;
  onDisconnect?: () => void;
}

export const WalletDetails: React.FC<WalletDetailsProps> = ({
  address,
  chainName = "Ethereum",
  walletName = "MetaMask",
  walletIcon = "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/metamask.webp",
  onDisconnect
}) => {
  if (!address) return null;

  return (
    <>
      <h3 className="text-sm text-tw-gray-200">
        Connected to <span className="font-bold">{chainName}</span>
      </h3>
      <div className="w-full rounded-xl bg-tw-orange-400/20 p-2 flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <img
            src={walletIcon}
            alt="wallet"
            className="w-10 h-10"
          />
          <div className="flex flex-col">
            <p className="text-xs">
              <span className="text-tw-orange-400">{walletName} Wallet</span>
            </p>
            <CopyMessage textToCopy={address}>
              <p className="flex gap-2 items-center">
                {formatAddress(address)} <IconCopy className="w-4 h-4" />
              </p>
            </CopyMessage>
          </div>
        </div>
      </div>
      <Button fullWidth variant="ghost" onPress={onDisconnect}>
        <span>Disconnect</span>
        <IconLogout className="w-4 h-4" />
      </Button>
    </>
  );
};
