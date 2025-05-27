import { nfpmContract, factoryContract } from './contracts';
import { CLPoolContract } from './contracts';

import nfpmAbi from '../abis/NonfungiblePositionManager.json';
import CLPoolAbi from '../abis/CLPoolAbi.json';

// Minimal Factory ABI for getPool function
const factoryAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenA', type: 'address' },
      { internalType: 'address', name: 'tokenB', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' },
    ],
    name: 'getPool',
    outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export const nfpmContractConfig = {
  address: nfpmContract as `0x${string}`,
  abi: nfpmAbi,
};

export const poolContractConfig = {
  address: CLPoolContract as `0x${string}`,
  abi: CLPoolAbi,
};

export const factoryContractConfig = {
  address: factoryContract as `0x${string}`,
  abi: factoryAbi,
};
