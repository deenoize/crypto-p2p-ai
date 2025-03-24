"use client";

import React from 'react';
import { ModeToggle } from "@/components/mode-toggle"

interface DashboardHeaderProps {
  exchange: string;
  fiat: string;
  crypto: string;
}

export function DashboardHeader({ exchange, fiat, crypto }: DashboardHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">
          Binance P2P Dashboard - {crypto}/{fiat} ({exchange.toUpperCase()})
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
      </div>
    </div>
  );
} 