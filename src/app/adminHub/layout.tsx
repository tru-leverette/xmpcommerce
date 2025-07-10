import React, { ReactNode } from "react";

export default function AdminHubLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}