import type React from "react";
import { twMerge } from "~/utils/twMerge";

interface Props {
  title: string;
  data?: number | string | React.ReactNode;
  className?: string;
}

export const CellData: React.FC<Props> = ({ title, data, className }) => {
  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      <div className="text-xs text-white/50 lg:hidden">{title}</div>
      <div className="flex items-center  justify-between gap-3">
        <div>{data ? data : "-"}</div>
      </div>
    </div>
  );
};
