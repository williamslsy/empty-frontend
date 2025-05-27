import { nfpmContract } from './contracts';
import { CLPoolContract } from './contracts';

import nfpmAbi from '../abis/NonfungiblePositionManager.json';
import CLPoolAbi from '../abis/CLPoolAbi.json';

export const nfpmContractConfig = {
  address: nfpmContract as `0x${string}`,
  abi: nfpmAbi,
};

export const poolContractConfig = {
  address: CLPoolContract as `0x${string}`,
  abi: CLPoolAbi,
};
