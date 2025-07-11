import React, { ReactNode } from "react";

type TooltipProps = {
  show: boolean;
  children: ReactNode;
};

export function Tooltip({ show, children }: TooltipProps) {
  if (!show) return null;
  return (
    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10">
      {children}
    </div>
  );
}