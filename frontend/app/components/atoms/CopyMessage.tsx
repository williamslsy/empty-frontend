import clsx from 'clsx';
import { useState } from 'react';
import { motion } from 'motion/react';
import { copyToClipboard } from '~/utils/browser';

import type { HTMLAttributes, PropsWithChildren } from 'react';
import { useToast } from '~/app/hooks';

interface Props {
  textToCopy: string;
}

const CopyMessage: React.FC<HTMLAttributes<HTMLDivElement> & PropsWithChildren<Props>> = ({ textToCopy, children, className, ...props }) => {
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const { toast } = useToast();
  const handlerCopy = (text: string) => {
    copyToClipboard(text);
    toast.success({
      title: 'Copied to clipboard',
    });
    setToolTipVisible(true);
    setTimeout(() => setToolTipVisible(false), 1500);
  };

  return (
    <motion.button whileTap={{ color: '#eead21' }} className={clsx('w-fit hover:cursor-pointer outline-none', className)} onClick={() => handlerCopy(textToCopy)}>
      {children}
    </motion.button>
  );
};

export default CopyMessage;
