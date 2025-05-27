import type React from 'react';
import { twMerge } from '~/utils/twMerge';

interface Props {
  title: string;
  data: React.ReactNode;
  className?: string;
}

export const CellData: React.FC<Props> = ({ title, data, className }) => {
  return (
    <div className={twMerge('flex flex-col gap-2', className)}>
      <span className="text-xs text-white/50 lg:hidden">{title}</span>
      <div className="flex items-center justify-between gap-3">{data}</div>
    </div>
  );
};
