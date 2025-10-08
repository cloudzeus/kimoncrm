"use client";

import { Toaster } from "@/components/ui/sonner";
import { CommandMenu } from "@/components/command-menu";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
      <CommandMenu />
    </SessionProvider>
  );
}
