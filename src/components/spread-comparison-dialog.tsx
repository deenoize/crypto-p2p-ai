"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SpreadComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buyOrder: any;
  sellOrder: any;
  fiat: string;
}

export function SpreadComparisonDialog({
  isOpen,
  onClose,
  buyOrder,
  sellOrder,
  fiat
}: SpreadComparisonDialogProps) {
  // Calculate spread percentage
  const calculateSpread = () => {
    const buyPrice = parseFloat(buyOrder.price);
    const sellPrice = parseFloat(sellOrder.price);
    return ((sellPrice - buyPrice) / buyPrice * 100).toFixed(2);
  };

  // Calculate potential profit
  const calculateProfit = () => {
    const buyPrice = parseFloat(buyOrder.price);
    const sellPrice = parseFloat(sellOrder.price);
    const buyLimits = getOrderLimits(buyOrder);
    const sellLimits = getOrderLimits(sellOrder);
    
    // Find the maximum trade amount possible considering both limits
    const maxTradeAmount = Math.min(
      buyLimits.max / buyPrice, // Convert fiat limit to crypto
      sellLimits.max / sellPrice, // Convert fiat limit to crypto
      parseFloat(buyOrder.volume || buyOrder.amount || '0'),
      parseFloat(sellOrder.volume || sellOrder.amount || '0')
    );

    // Calculate profit in fiat
    const profit = maxTradeAmount * (sellPrice - buyPrice);
    return profit.toFixed(2);
  };

  // Helper function to get merchant name based on exchange data structure
  const getMerchantName = (order: any) => {
    if (order.advertiser?.nickName) {
      return order.advertiser.nickName;
    }
    if (order.merchant?.name) {
      return order.merchant.name;
    }
    return 'Unknown';
  };

  // Helper function to get order limits
  const getOrderLimits = (order: any) => {
    const min = order.minSingleTransAmount || order.minAmount || 0;
    const max = order.maxSingleTransAmount || order.maxAmount || 0;
    return { min, max };
  };

  // Get limits for both orders
  const buyLimits = getOrderLimits(buyOrder);
  const sellLimits = getOrderLimits(sellOrder);

  // Get crypto currency
  const cryptoCurrency = buyOrder.crypto || sellOrder.crypto || 'BTC';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background p-4">
        <DialogHeader className="pb-2">
          <DialogTitle>Spread Comparison</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[1fr,auto,1fr] gap-x-4 gap-y-2">
          {/* Headers */}
          <div className="text-sm font-medium">To Buy</div>
          <div></div>
          <div className="text-sm font-medium">To Sell</div>

          {/* Merchant Names */}
          <div className="text-xs opacity-70">{getMerchantName(buyOrder)}</div>
          <div></div>
          <div className="text-xs opacity-70">{getMerchantName(sellOrder)}</div>

          {/* Prices */}
          <div className="text-sm font-medium">{buyOrder.price} {fiat}</div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-green-500">
              +{calculateSpread()}%
            </div>
            <div className="text-xs text-green-500">
              Max profit: {calculateProfit()} {fiat}
            </div>
          </div>
          <div className="text-sm font-medium">{sellOrder.price} {fiat}</div>

          {/* Volumes */}
          <div className="text-xs">
            {buyOrder.volume || buyOrder.amount || '0'} {cryptoCurrency}
          </div>
          <div></div>
          <div className="text-xs">
            {sellOrder.volume || sellOrder.amount || '0'} {cryptoCurrency}
          </div>

          {/* Limits */}
          <div className="text-xs opacity-70">
            {buyLimits.min} - {buyLimits.max} {fiat}
          </div>
          <div></div>
          <div className="text-xs opacity-70">
            {sellLimits.min} - {sellLimits.max} {fiat}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 