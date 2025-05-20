"use client";

import type React from "react";
import Avatar from "../atoms/Avatar";
import { Button } from "../atoms/Button";
import { useModal } from "~/app/providers/ModalProvider";
import { ModalTypes } from "~/types/modal";
import { Popover, PopoverContent, PopoverTrigger } from "../atoms/Popover";
import { WalletDetails } from "./WalletDetails";
import { useState } from "react";

// Mock wallet hook
const useMockWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [chainName, setChainName] = useState("Ethereum");
  const [walletName, setWalletName] = useState("MetaMask");

  // Mock connect function
  const connect = () => {
    setIsConnected(true);
    setAddress("0x1234...5678"); // Mock address
    setChainName("Ethereum");
    setWalletName("MetaMask");
  };

  // Mock disconnect function
  const disconnect = () => {
    setIsConnected(false);
    setAddress("");
    setChainName("");
    setWalletName("");
  };

  return {
    isConnected,
    address,
    chainName,
    walletName,
    connect,
    disconnect
  };
};

// Format address for display
const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const ConnectWallet: React.FC = () => {
  const { showModal } = useModal();
  const { address, isConnected, chainName, walletName, disconnect } = useMockWallet();

  if (!isConnected) {
    return <Button onPress={() => showModal(ModalTypes.connect_wallet)}>Connect Wallet</Button>;
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Button color="secondary">
          <Avatar seed={address} className="w-4 h-4" /> {formatAddress(address)}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <WalletDetails 
          address={address}
          chainName={chainName}
          walletName={walletName}
          onDisconnect={disconnect}
        />
      </PopoverContent>
    </Popover>
  );
};

export const MobileConnectWallet: React.FC<{ closeMenu: () => void }> = ({ closeMenu }) => {
  const { showModal } = useModal();
  const { address, isConnected, chainName, walletName, disconnect } = useMockWallet();

  if (!isConnected) {
    return (
      <Button fullWidth onPress={() => [showModal(ModalTypes.connect_wallet), closeMenu()]}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-2 p-2 border border-white/10 rounded-xl">
      <WalletDetails 
        address={address}
        chainName={chainName}
        walletName={walletName}
        onDisconnect={disconnect}
      />
    </div>
  );
};
