import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CNY': '¥',
  'AUD': 'A$',
  'CAD': 'C$',
  'HKD': 'HK$',
  'SGD': 'S$',
  'INR': '₹',
  'RUB': '₽',
  'BRL': 'R$',
  'TRY': '₺',
  'NGN': '₦',
  'VND': '₫'
};

const COLOR_PALETTE = [
  'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300',
  'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-300',
  'bg-violet-500/15 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300',
  'bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300',
  'bg-cyan-500/15 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300',
  'bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300',
  'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300',
  'bg-green-500/15 text-green-700 dark:bg-green-400/20 dark:text-green-300',
  'bg-lime-500/15 text-lime-700 dark:bg-lime-400/20 dark:text-lime-300',
  'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
  'bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300',
  'bg-orange-500/15 text-orange-700 dark:bg-orange-400/20 dark:text-orange-300',
  'bg-red-500/15 text-red-700 dark:bg-red-400/20 dark:text-red-300',
  'bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300',
  'bg-pink-500/15 text-pink-700 dark:bg-pink-400/20 dark:text-pink-300',
  'bg-fuchsia-500/15 text-fuchsia-700 dark:bg-fuchsia-400/20 dark:text-fuchsia-300',
  'bg-purple-500/15 text-purple-700 dark:bg-purple-400/20 dark:text-purple-300',
  'bg-blue-600/15 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
];

// Cache for consistent color assignment
const paymentMethodColorCache = new Map<string, string>();
const merchantTypeColorCache = new Map<string, string>();

// Merchant type color mapping
type MerchantType = 'Elite Trader' | 'Pro Trader' | 'Experienced' | 'Regular' | 'New Trader';

const MERCHANT_TYPE_COLORS: Record<MerchantType, string> = {
  'Elite Trader': 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300',
  'Pro Trader': 'bg-green-500/15 text-green-700 dark:bg-green-400/20 dark:text-green-300',
  'Experienced': 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300',
  'Regular': 'bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300',
  'New Trader': 'bg-red-500/15 text-red-700 dark:bg-red-400/20 dark:text-red-300'
};

function getPaymentMethodColor(method: string): string {
  if (!paymentMethodColorCache.has(method)) {
    // Use the method name to consistently pick a color from the palette
    const index = Array.from(method).reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLOR_PALETTE.length;
    paymentMethodColorCache.set(method, COLOR_PALETTE[index]);
  }
  return paymentMethodColorCache.get(method) || 'bg-neutral-500/15 text-neutral-700 dark:bg-neutral-400/20 dark:text-neutral-300';
}

interface Order {
  price: number;
  amount: number;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  advNo: string;
  merchant: {
    name: string;
    rating: number;
    completedTrades: number;
    completionRate: number;
    lastOnlineTime: number;
    userType: string;
    userIdentity: string;
  }
}

interface OrderBookProps {
  fiat: string;
  crypto: string;
  buyOrders?: Order[];
  sellOrders?: Order[];
  loading?: boolean;
  error?: string | null;
  hasChanges?: boolean;
}

interface OrderTableProps {
  orders: Order[];
  type: 'buy' | 'sell';
  crypto: string;
  formatPrice: (price: number) => string;
  formatAmount: (amount: number) => string;
  formatLimit: (min: number, max: number) => string;
  formatPercent: (value: number) => string;
  formatLastOnline: (lastOnlineTime: number) => string;
  getMerchantTypeDisplay: (completedTrades: number, rating: number, completionRate: number) => string;
}

// Simplify OrderRow to focus only on rendering the static content
const OrderRow = React.memo(({ 
  order,
  type,
  crypto,
  formatPrice,
  formatAmount,
  formatLimit,
  formatPercent,
  formatLastOnline,
  getMerchantTypeDisplay,
  className
}: {
  order: Order;
  type: 'buy' | 'sell';
  crypto: string;
  formatPrice: (price: number) => string;
  formatAmount: (amount: number) => string;
  formatLimit: (min: number, max: number) => string;
  formatPercent: (value: number) => string;
  formatLastOnline: (lastOnlineTime: number) => string;
  getMerchantTypeDisplay: (completedTrades: number, rating: number, completionRate: number) => string;
  className?: string;
}) => {
  const merchantType = getMerchantTypeDisplay(
    order.merchant.completedTrades,
    order.merchant.rating * 100,
    order.merchant.completionRate * 100
  ) as MerchantType;

  return (
    <TableRow className={className}>
      <TableCell className={cn(
        "py-1 px-2 text-xs whitespace-nowrap",
        type === 'buy' ? "text-green-600" : "text-red-600"
      )}>
        {formatPrice(order.price)}
      </TableCell>
      <TableCell className="py-1 px-2 text-xs whitespace-nowrap">
        <div className="flex flex-col">
          <span>{formatAmount(order.amount)} {crypto}</span>
          <span className="text-[10px] text-muted-foreground">Limit: {formatLimit(order.minAmount, order.maxAmount)}</span>
        </div>
      </TableCell>
      <TableCell className="py-1 px-2">
        <div className="flex flex-wrap gap-1 max-w-full">
          {order.paymentMethods.map((method, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className={cn(
                "payment-method-badge px-2 py-0.5 my-0.5 text-[10px] transition-all duration-200 hover:bg-muted inline-block",
                getPaymentMethodColor(method)
              )}
            >
              {method}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="py-1 px-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span className="font-medium text-xs truncate max-w-full">{order.merchant.name}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "px-1.5 py-0 text-[10px] transition-all duration-200 whitespace-nowrap flex-shrink-0",
                MERCHANT_TYPE_COLORS[merchantType]
              )}
            >
              {merchantType}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{formatPercent(order.merchant.rating * 100)}% pos</span>
            <span>{formatPercent(order.merchant.completionRate * 100)}% comp</span>
            <span>{formatLastOnline(order.merchant.lastOnlineTime)}</span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Always return true to prevent re-renders once the order is rendered
  // We handle animations separately from React's reconciliation
  return prevProps.order.advNo === nextProps.order.advNo;
});

// Create a completely stable OrderTable that doesn't re-render existing orders
const OrderTable = React.memo(({ 
  orders, 
  type,
  crypto,
  formatPrice,
  formatAmount,
  formatLimit,
  formatPercent,
  formatLastOnline,
  getMerchantTypeDisplay
}: OrderTableProps) => {
  // Keep track of orders that need to animate
  const prevOrdersRef = useRef<Record<string, Order>>({});
  const ordersContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle animations via DOM manipulation
  useEffect(() => {
    const container = ordersContainerRef.current;
    if (!container) return;
    
    // Get current and previous order IDs
    const currentIds = new Set(orders.map(o => o.advNo));
    const prevIds = new Set(Object.keys(prevOrdersRef.current));
    
    // Find new orders to animate in
    const newRows = container.querySelectorAll(`[data-new="true"]`);
    newRows.forEach(row => {
      // Reset any previous animations
      row.classList.remove('animate-in');
      
      // Trigger reflow to restart animation - cast to HTMLElement to access offsetWidth
      void (row as HTMLElement).offsetWidth;
      
      // Start animation
      row.classList.add('animate-in');
    });
    
    // Update our reference for the next comparison
    const newOrdersMap: Record<string, Order> = {};
    orders.forEach(order => {
      newOrdersMap[order.advNo] = order;
    });
    prevOrdersRef.current = newOrdersMap;
    
  }, [orders]);
  
  // Using a stable structure with a unique key for each order position
  return (
    <div className="flex-1" ref={ordersContainerRef}>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 sticky top-0 z-30 bg-background",
        type === 'buy' ? "text-green-600" : "text-red-600"
      )}>
        {type === 'buy' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        <h3 className="text-xs font-medium">{type === 'buy' ? 'Buy' : 'Sell'} Orders</h3>
      </div>
      <style jsx global>{`
        .animate-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        
        .animate-out {
          animation: slideOut 0.3s ease-out forwards;
          pointer-events: none;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(15px);
          }
        }
        
        /* Ensure table adjusts properly */
        .order-book-table {
          table-layout: fixed;
          width: 100%;
        }
        
        .order-book-table td {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Payment method badge hover effect for better readability */
        .payment-method-badge {
          transition: all 0.2s ease;
          position: relative;
          word-break: keep-all;
          white-space: normal;
        }
        
        .payment-method-badge:hover {
          z-index: 5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <Table className="order-book-table">
        <TableHeader className="sticky top-0 z-40 bg-background">
          <TableRow>
            <TableHead className="py-1 px-2 text-xs w-[12%] min-w-[70px]">Price</TableHead>
            <TableHead className="py-1 px-2 text-xs w-[18%] min-w-[100px]">Amount</TableHead>
            <TableHead className="py-1 px-2 text-xs w-[35%] min-w-[150px]">Payment</TableHead>
            <TableHead className="py-1 px-2 text-xs w-[35%] min-w-[120px]">Merchant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => {
            const isNew = !prevOrdersRef.current[order.advNo];
            // Use a stable key that doesn't change between renders
            return (
              <OrderRow
                key={order.advNo}
                order={order}
                type={type}
                crypto={crypto}
                formatPrice={formatPrice}
                formatAmount={formatAmount}
                formatLimit={formatLimit}
                formatPercent={formatPercent}
                formatLastOnline={formatLastOnline}
                getMerchantTypeDisplay={getMerchantTypeDisplay}
                className={isNew ? "relative z-10" : undefined}
                data-new={isNew ? "true" : "false"}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the order IDs change
  const prevIds = prevProps.orders.map(o => o.advNo).join(',');
  const nextIds = nextProps.orders.map(o => o.advNo).join(',');
  return prevIds === nextIds;
});

export const OrderBook = React.memo(({ 
  fiat, 
  crypto, 
  buyOrders = [], 
  sellOrders = [],
  loading = false,
  error = null,
  hasChanges = false
}: OrderBookProps) => {
  // Memoize the orders to prevent unnecessary re-renders
  const buyOrdersMemo = React.useMemo(() => buyOrders, [JSON.stringify(buyOrders.map(o => o.advNo))]);
  const sellOrdersMemo = React.useMemo(() => sellOrders, [JSON.stringify(sellOrders.map(o => o.advNo))]);
  
  const formatAmount = (amount: number) => amount.toLocaleString();
  const formatPrice = (price: number) => {
    const symbol = CURRENCY_SYMBOLS[fiat] || fiat;
    return `${symbol}${price.toLocaleString()}`;
  };
  const formatPercent = (value: number) => `${value.toFixed(1)}`;
  const formatLastOnline = (lastOnlineTime: number) => {
    if (!lastOnlineTime && lastOnlineTime !== 0) {
      return 'Unknown';
    }

    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - lastOnlineTime;
    
    if (diffSeconds < 0) return 'Just now';
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  };
  const formatLimit = (min: number, max: number) => {
    const symbol = CURRENCY_SYMBOLS[fiat] || fiat;
    return `${symbol}${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getMerchantTypeDisplay = (completedTrades: number, rating: number, completionRate: number) => {
    if (completedTrades >= 500 && rating >= 95 && completionRate >= 95) return 'Elite Trader';
    if (completedTrades >= 200 && rating >= 90 && completionRate >= 90) return 'Pro Trader';
    if (completedTrades >= 100) return 'Experienced';
    if (completedTrades >= 50) return 'Regular';
    return 'New Trader';
  };

  // Memoize the formatting functions to prevent unnecessary re-renders
  const formattingProps = React.useMemo(() => ({
    formatPrice,
    formatAmount,
    formatLimit,
    formatPercent,
    formatLastOnline,
    getMerchantTypeDisplay
  }), [fiat]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="py-1">
          <CardTitle className="text-xs">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex items-center justify-center h-24">
            <div role="status" className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="py-1">
          <CardTitle className="text-xs">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex items-center justify-center h-24 text-red-500 text-xs">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-1">
        <CardTitle className="text-xs">Order Book</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex gap-2">
          <OrderTable 
            orders={sellOrdersMemo} 
            type="sell"
            crypto={crypto}
            {...formattingProps}
          />
          <OrderTable 
            orders={buyOrdersMemo} 
            type="buy"
            crypto={crypto}
            {...formattingProps}
          />
        </div>
      </CardContent>
    </Card>
  );
}); 