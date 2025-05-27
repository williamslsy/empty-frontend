import type React from 'react';
import { twMerge } from '~/utils/twMerge';

interface Props {
  className?: string;
  dashed?: boolean;
}

const Divider: React.FC<Props> = ({ className, dashed = false }) => {
  return <div className={twMerge('w-full h-px bg-white/10', dashed && 'border-t border-dashed border-white/10 bg-transparent', className)} />;
};

export default Divider;
