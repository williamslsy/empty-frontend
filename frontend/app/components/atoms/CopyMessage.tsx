import clsx from "clsx";
import React, { HTMLAttributes, PropsWithChildren, useState } from "react";
import { motion } from "framer-motion";
import { copyToClipboard } from "~/utils/browser";

interface Props {
  textToCopy: string;
}

const CopyMessage: React.FC<HTMLAttributes<HTMLDivElement> & PropsWithChildren<Props>> = ({ textToCopy, children, className, ...props }) => {
  const [toolTipVisible, setToolTipVisible] = useState(false);

  const handlerCopy = (text: string) => {
    copyToClipboard(text);
    setToolTipVisible(true);
    setTimeout(() => setToolTipVisible(false), 1500);
  };

  return (
    <motion.button
      whileTap={{ color: "#eead21" }}
      className={clsx("w-fit hover:cursor-pointer outline-none", className)}
      onClick={() => handlerCopy(textToCopy)}
    >
      {children}
    </motion.button>
  );
};

export default CopyMessage;
