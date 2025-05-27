import { Tooltip as NextTooltip, type TooltipProps } from '@heroui/react';
import type React from 'react';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { twMerge } from '~/utils/twMerge';

interface Props {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<Props> = ({ content, children, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)} className="cursor-pointer">
        {children}
      </div>
      {isVisible && (
        <div className={twMerge('absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-tw-gray-900 border border-white/10 rounded-lg shadow-lg min-w-max', className)}>
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-tw-gray-900" />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
