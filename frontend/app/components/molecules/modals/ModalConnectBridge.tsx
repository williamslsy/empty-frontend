import BasicModal from "~/app/components/templates/BasicModal";
import { Button } from "~/app/components/atoms/Button";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import CopyMessage from "../../atoms/CopyMessage";
import { IconCopy, IconLogout } from "@tabler/icons-react";

// Mock types
interface MockConnector {
  id: string;
  name: string;
  isInstalled: boolean;
  uid: string;
}

// Mock data
const mockConnectors: MockConnector[] = [
  {
    id: "metamask",
    name: "MetaMask",
    isInstalled: true,
    uid: "metamask-1"
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    isInstalled: true,
    uid: "walletconnect-1"
  },
  {
    id: "coinbase",
    name: "Coinbase",
    isInstalled: true,
    uid: "coinbase-1"
  }
];

// Mock wallet hook
const useMockWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");

  const connect = () => {
    setIsConnected(true);
    setAddress("0x1234...5678");
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress("");
  };

  return {
    isConnected,
    address,
    connect,
    disconnect
  };
};

function ConnectorButton({ connector, onClick }: { connector: MockConnector; onClick: () => void }) {
  const { name, id, isInstalled } = connector;

  return (
    <Button
      radius="lg"
      color="tertiary"
      variant="ghost"
      disabled={!isInstalled}
      onPress={onClick}
      type="button"
      className="flex flex-col p-1 h-fit overflow-hidden cursor-pointer"
    >
      <div className="h-10 w-10 p-1 relative">
        <Image
          className="w-full h-full rounded-full object-contain relative z-10"
          src={`https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/${id}.webp`}
          width={40}
          height={40}
          alt={`wallet-${name}-${id}`}
          priority
        />
      </div>
      <p className="text-sm relative z-10 transition-all duration-400">{name}</p>
    </Button>
  );
}

const ModalConnectBridge: React.FC = () => {
  const { isConnected: isEVMConnected, address: evmAddress, connect: connectEVM, disconnect: disconnectEVM } = useMockWallet();
  const { isConnected: isCosmosConnected, address: cosmosAddress, connect: connectCosmos, disconnect: disconnectCosmos } = useMockWallet();

  return (
    <BasicModal title="Bridge Connector" classNames={{ wrapper: "max-w-sm", container: "p-2" }}>
      <div className="flex flex-col gap-4">
        <div className="bg-tw-bg rounded-2xl p-3 flex flex-col gap-2 w-full">
          <p className="text-xs">{`Connect${isCosmosConnected ? "ed to" : ""} Babylon`}</p>
          {isCosmosConnected ? (
            <div className="w-full rounded-xl bg-white/10 p-2 flex items-center justify-between">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex gap-2 items-center">
                  <img
                    src="https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/keplr.webp"
                    alt="wallet"
                    className="w-10 h-10"
                  />
                  <div className="flex flex-col">
                    <p className="text-xs">
                      <span className="text-tw-orange-400">Keplr Wallet</span>
                    </p>
                    <CopyMessage textToCopy={cosmosAddress}>
                      <p className="flex gap-2 items-center">
                        {cosmosAddress} <IconCopy className="w-4 h-4" />
                      </p>
                    </CopyMessage>
                  </div>
                </div>
                <Button
                  color="secondary"
                  onClick={disconnectCosmos}
                  className="w-10 h-10 rounded-xl p-1"
                  isIconOnly
                >
                  <IconLogout className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {mockConnectors.map((connector) => (
                <ConnectorButton
                  key={connector.uid}
                  connector={connector}
                  onClick={connectCosmos}
                />
              ))}
            </div>
          )}
        </div>
        <div className="bg-tw-bg rounded-2xl p-3 flex flex-col gap-2 w-full">
          <p className="text-xs">{`Connect${isEVMConnected ? "ed to" : ""} EVM`}</p>
          {isEVMConnected ? (
            <div className="w-full rounded-xl bg-white/10 p-2 flex items-center justify-between">
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex gap-2 items-center">
                  <img
                    src="https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/metamask.webp"
                    alt="wallet"
                    className="w-10 h-10"
                  />
                  <div className="flex flex-col">
                    <p className="text-xs">
                      <span className="text-tw-orange-400">MetaMask Wallet</span>
                    </p>
                    <CopyMessage textToCopy={evmAddress}>
                      <p className="flex gap-2 items-center">
                        {evmAddress} <IconCopy className="w-4 h-4" />
                      </p>
                    </CopyMessage>
                  </div>
                </div>
                <Button
                  color="secondary"
                  onClick={disconnectEVM}
                  className="w-10 h-10 rounded-xl p-1"
                  isIconOnly
                >
                  <IconLogout className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {mockConnectors.map((connector) => (
                <ConnectorButton
                  key={connector.uid}
                  connector={connector}
                  onClick={connectEVM}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </BasicModal>
  );
};

export default ModalConnectBridge;
