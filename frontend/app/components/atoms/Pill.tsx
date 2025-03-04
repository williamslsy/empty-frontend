import clsx from "clsx";
import React, { PropsWithChildren } from "react";

interface Props {
  color?: "grey";
  className?: string;
}

const Pill: React.FC<PropsWithChildren<Props>> = ({ color = "grey", children, className }) => {
  return (
    <div
      className={clsx(
        "py-1 px-2 rounded-full w-fit h-fit text-xs flex items-center justify-center",
        { "bg-white/10 text-white/50": color.includes("grey") },
        className
      )}
    >
      {children}
    </div>
  );
};

export default Pill;
