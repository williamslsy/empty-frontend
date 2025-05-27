import type React from 'react';
import { twMerge } from '~/utils/twMerge';

interface Props {
  className?: string;
}

const Skeleton: React.FC<Props> = ({ className }) => {
  return <div className={twMerge('animate-pulse bg-white/10 rounded', className)} />;
};

export default Skeleton;
