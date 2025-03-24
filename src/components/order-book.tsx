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
  spotPrice?: number;
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
  formatDelta: (price: number, reference?: number) => string | null;
  spotPrice?: number;
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
  formatDelta,
  className,
  spotPrice,
  ...props
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
  formatDelta: (price: number, reference?: number) => string | null;
  className?: string;
  spotPrice?: number;
  [key: string]: any;
}) => {
  // Use useMemo for expensive calculations to prevent recalculation on re-render
  const merchantType = React.useMemo(() => {
    return getMerchantTypeDisplay(
      order.merchant.completedTrades,
      order.merchant.rating * 100,
      order.merchant.completionRate * 100
    ) as MerchantType;
  }, [order.merchant.completedTrades, order.merchant.rating, order.merchant.completionRate, getMerchantTypeDisplay]);

  // Directly calculate the delta text using the passed spotPrice
  const deltaInfo = React.useMemo(() => {
    let deltaText = null;
    let deltaClass = '';
    
    if (spotPrice) {
      const delta = ((order.price - spotPrice) / spotPrice) * 100;
      deltaText = delta > 0 ? `+${delta.toFixed(2)}%` : `${delta.toFixed(2)}%`;
      deltaClass = delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : '';
    }
    
    return { deltaText, deltaClass };
  }, [order.price, spotPrice]);

  // Memoize the rendered content to prevent unnecessary re-renders
  const priceCell = React.useMemo(() => (
    <TableCell className={cn(
      "py-1 px-2 text-xs whitespace-nowrap",
      type === 'buy' ? "text-green-600" : "text-red-600"
    )}>
      <div className="flex flex-col">
        <span>{formatPrice(order.price)}</span>
        {deltaInfo.deltaText && (
          <span className={cn("text-[10px]", deltaInfo.deltaClass)}>
            {deltaInfo.deltaText}
          </span>
        )}
      </div>
    </TableCell>
  ), [formatPrice, order.price, type, deltaInfo]);

  const amountCell = React.useMemo(() => (
    <TableCell className="py-1 px-2 text-xs whitespace-nowrap">
      <div className="flex flex-col">
        <span>{formatAmount(order.amount)} {crypto}</span>
        <span className="text-[10px] text-muted-foreground">Limit: {formatLimit(order.minAmount, order.maxAmount)}</span>
      </div>
    </TableCell>
  ), [formatAmount, formatLimit, order.amount, order.minAmount, order.maxAmount, crypto]);

  const paymentCell = React.useMemo(() => (
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
  ), [order.paymentMethods]);

  const merchantCell = React.useMemo(() => (
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
  ), [
    order.merchant.name, 
    order.merchant.rating, 
    order.merchant.completionRate, 
    order.merchant.lastOnlineTime,
    merchantType,
    formatPercent,
    formatLastOnline
  ]);

  return (
    <TableRow 
      className={cn("order-row", className)} 
      {...props}
    >
      {priceCell}
      {amountCell}
      {paymentCell}
      {merchantCell}
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Change the memoization comparator to include spot price changes
  return (
    prevProps.order.advNo === nextProps.order.advNo && 
    prevProps.spotPrice === nextProps.spotPrice
  );
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
  getMerchantTypeDisplay,
  formatDelta,
  spotPrice
}: OrderTableProps) => {
  // Keep track of orders that need to animate
  const prevOrdersRef = useRef<Record<string, Order>>({});
  const prevOrdersIdsRef = useRef<string[]>([]);
  const ordersContainerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  
  // Create a reference for the animation frames to allow cancellation
  const animationFramesRef = useRef<Record<string, number>>({});
  
  // Keep a record of all orders with their positions for stable rendering
  const [orderPositions, setOrderPositions] = useState<Record<string, number>>({});
  
  // Handle animations via DOM manipulation
  useEffect(() => {
    const container = ordersContainerRef.current;
    const tableBody = tableBodyRef.current;
    if (!container || !tableBody) return;
    
    // Cancel any ongoing animations to prevent conflicts
    Object.values(animationFramesRef.current).forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    animationFramesRef.current = {};
    
    // Create maps of current and previous orders by ID
    const currentOrdersMap: Record<string, Order> = {};
    const currentOrderIds: string[] = orders.map(o => {
      currentOrdersMap[o.advNo] = o;
      return o.advNo;
    });
    
    // Get references to previous orders
    const prevOrdersMap = prevOrdersRef.current;
    const prevOrderIds = prevOrdersIdsRef.current;
    
    // Create a Set for faster lookups
    const currentIdsSet = new Set(currentOrderIds);
    const prevIdsSet = new Set(prevOrderIds);
    
    // Find new and removed order IDs
    const newOrderIds = currentOrderIds.filter(id => !prevIdsSet.has(id));
    const removedOrderIds = prevOrderIds.filter(id => !currentIdsSet.has(id));
    
    // Update order positions map for stable rendering
    const newPositions = { ...orderPositions };
    
    // Assign positions to new orders
    newOrderIds.forEach(id => {
      // Find position in the current order array
      const position = currentOrderIds.indexOf(id);
      newPositions[id] = position;
    });
    
    // Remove positions for removed orders after animation completes
    setTimeout(() => {
      const positionsToUpdate = { ...orderPositions };
      removedOrderIds.forEach(id => {
        delete positionsToUpdate[id];
      });
      setOrderPositions(positionsToUpdate);
    }, 500); // Wait for animation to complete

    // First, handle entering new orders
    newOrderIds.forEach(id => {
      const row = tableBody.querySelector(`[data-order-id="${id}"]`);
      if (row) {
        // Set style properties directly on the DOM element
        const element = row as HTMLElement;
        
        // Set initial state - transparent and above its final position
        element.style.opacity = '0';
        element.style.transform = 'translateY(-15px)';
        element.style.position = 'relative';
        element.style.zIndex = '2';
        element.style.pointerEvents = 'none'; // Prevent interaction during animation
        
        // Use requestAnimationFrame to ensure smooth animation
        animationFramesRef.current[id] = requestAnimationFrame(() => {
          // Add transition
          element.style.transition = 'opacity 350ms ease-out, transform 350ms ease-out';
          
          // Set a small delay to ensure the browser processes the initial state
          setTimeout(() => {
            // Animate to final state
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // Clean up after animation completes
            setTimeout(() => {
              element.style.zIndex = '1';
              element.style.pointerEvents = 'auto';
              element.style.transition = '';
              element.style.position = 'relative';
            }, 350);
          }, 20);
        });
      }
    });
    
    // Handle exiting orders - keep them in DOM and animate out
    removedOrderIds.forEach(id => {
      const row = tableBody.querySelector(`[data-order-id="${id}"]`);
      if (row) {
        const element = row as HTMLElement;
        
        // Save the element's current position before it's removed from the flow
        const rect = element.getBoundingClientRect();
        
        // Prepare for exit animation
        element.style.position = 'absolute';
        element.style.top = `${rect.top}px`;
        element.style.left = `${rect.left}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        element.style.zIndex = '0';
        element.style.pointerEvents = 'none';
        
        // Use requestAnimationFrame for smooth animation
        animationFramesRef.current[id] = requestAnimationFrame(() => {
          element.style.transition = 'opacity 350ms ease-out, transform 350ms ease-out';
          
          // Set a small delay to ensure the browser processes the initial state
          setTimeout(() => {
            // Animate out
            element.style.opacity = '0';
            element.style.transform = 'translateY(15px)';
            
            // Remove the element from DOM after animation completes
            setTimeout(() => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            }, 350);
          }, 20);
        });
      }
    });
    
    // Update our references for the next render
    prevOrdersRef.current = { ...currentOrdersMap };
    prevOrdersIdsRef.current = [...currentOrderIds];
    
    // Cleanup function to cancel animations when component unmounts
    return () => {
      Object.values(animationFramesRef.current).forEach(frameId => {
        cancelAnimationFrame(frameId);
      });
    };
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
        /* Order animation styles */
        .order-book-table {
          table-layout: fixed;
          width: 100%;
          position: relative;
          contain: content;
        }
        
        .order-book-table td {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Create a stable stacking context for proper animations */
        .order-row {
          position: relative;
          z-index: 1;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
          perspective: 1000px;
          contain: layout style;
          will-change: transform, opacity;
        }
        
        /* Prevent flashing during transitions */
        .order-book-table tbody {
          position: relative;
          contain: layout style paint;
        }
        
        /* Payment method badge hover effect */
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
        <TableBody ref={tableBodyRef}>
          {orders.map((order) => {
            const isNew = !prevOrdersRef.current[order.advNo];
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
                formatDelta={formatDelta}
                className="order-row"
                data-order-id={order.advNo}
                data-new={isNew ? "true" : "false"}
                data-index={orderPositions[order.advNo] ?? orders.indexOf(order)}
                spotPrice={spotPrice}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}, (prevProps, nextProps) => {
  // We need to update in two cases:
  // 1. The order IDs have changed (new orders, removed orders, or reordering)
  // 2. The spot price has changed (to update delta calculations)
  const prevIds = prevProps.orders.map(o => o.advNo).join(',');
  const nextIds = nextProps.orders.map(o => o.advNo).join(',');
  const spotPriceChanged = prevProps.spotPrice !== nextProps.spotPrice;
  
  return prevIds === nextIds && !spotPriceChanged;
});

export const OrderBook = React.memo(({ 
  fiat, 
  crypto, 
  buyOrders = [], 
  sellOrders = [],
  loading = false,
  error = null,
  hasChanges = false,
  spotPrice
}: OrderBookProps) => {
  // Add state for spot price if not provided as a prop
  const [currentSpotPrice, setCurrentSpotPrice] = useState<number | undefined>(spotPrice);
  const [spotLoading, setSpotLoading] = useState<boolean>(false);

  // Map crypto symbols to CoinGecko IDs
  const cryptoIdMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'MATIC': 'matic-network',
    'SOL': 'solana'
  };

  // Fetch spot price if not provided
  useEffect(() => {
    // If spot price is provided directly, use it
    if (spotPrice !== undefined) {
      setCurrentSpotPrice(spotPrice);
      return;
    }

    // Only fetch if we don't have a spot price
    const fetchSpotPrice = async () => {
      setSpotLoading(true);
      try {
        // Get the correct CoinGecko ID for the crypto
        const coinId = cryptoIdMap[crypto] || crypto.toLowerCase();
        
        // Using CoinGecko API
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${fiat.toLowerCase()}`);
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data[coinId] && data[coinId][fiat.toLowerCase()]) {
          const price = data[coinId][fiat.toLowerCase()];
          console.log(`Spot price for ${crypto}/${fiat}: ${price}`);
          setCurrentSpotPrice(price);
        } else {
          // Use fallback if API doesn't return expected data
          console.warn(`No spot price data for ${crypto}/${fiat}, using fallback`);
          useFallbackPrice();
        }
      } catch (err) {
        console.error('Error fetching spot price:', err);
        useFallbackPrice();
      } finally {
        setSpotLoading(false);
      }
    };

    // Calculate a fallback price from order data
    const useFallbackPrice = () => {
      // Using average of buy/sell orders as an estimation
      const buyAvg = buyOrders.length > 0 
        ? buyOrders.reduce((sum, order) => sum + order.price, 0) / buyOrders.length
        : 0;
      const sellAvg = sellOrders.length > 0 
        ? sellOrders.reduce((sum, order) => sum + order.price, 0) / sellOrders.length
        : 0;
      
      if (buyAvg && sellAvg) {
        const avgPrice = (buyAvg + sellAvg) / 2;
        console.log(`Using calculated average price: ${avgPrice}`);
        setCurrentSpotPrice(avgPrice);
      } else if (buyAvg) {
        console.log(`Using buy orders average price: ${buyAvg}`);
        setCurrentSpotPrice(buyAvg);
      } else if (sellAvg) {
        console.log(`Using sell orders average price: ${sellAvg}`);
        setCurrentSpotPrice(sellAvg);
      } else {
        console.log('No data available to calculate spot price');
      }
    };

    fetchSpotPrice();
  }, [crypto, fiat, spotPrice, buyOrders, sellOrders]);

  // Improved memoization strategy for orders that considers only ID changes
  // This prevents unnecessary rerenders when the content changes but the IDs remain the same
  const buyOrdersMemo = React.useMemo(() => buyOrders, [
    // Only rerender if the IDs change, not the content
    buyOrders.length,
    // Join IDs to create a stable dependency
    buyOrders.map(o => o.advNo).join(',')
  ]);
  
  const sellOrdersMemo = React.useMemo(() => sellOrders, [
    sellOrders.length,
    sellOrders.map(o => o.advNo).join(',')
  ]);
  
  const formatAmount = (amount: number) => amount.toLocaleString();
  const formatPrice = (price: number) => {
    const symbol = CURRENCY_SYMBOLS[fiat] || fiat;
    return `${symbol}${price.toLocaleString()}`;
  };
  const formatPercent = (value: number) => `${value.toFixed(1)}`;
  
  // Add a formatting function for the delta
  const formatDelta = (price: number, reference?: number) => {
    if (!reference) return null;
    
    const delta = ((price - reference) / reference) * 100;
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(2)}%`;
  };
  
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
    getMerchantTypeDisplay,
    formatDelta
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
        <CardTitle className="text-xs flex items-center">
          <span>Order Book</span>
          {spotLoading ? (
            <span className="ml-2 text-muted-foreground flex items-center">
              <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-gray-500 mr-1"></span>
              Loading spot price...
            </span>
          ) : currentSpotPrice ? (
            <span className="ml-2 text-muted-foreground">
              (Spot: {formatPrice(currentSpotPrice)})
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex gap-2">
          <OrderTable 
            orders={sellOrdersMemo} 
            type="sell"
            crypto={crypto}
            {...formattingProps}
            spotPrice={currentSpotPrice}
          />
          <OrderTable 
            orders={buyOrdersMemo} 
            type="buy"
            crypto={crypto}
            {...formattingProps}
            spotPrice={currentSpotPrice}
          />
        </div>
      </CardContent>
    </Card>
  );
}); 