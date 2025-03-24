import React, { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, LineChart, Loader2, AlertTriangle } from "lucide-react";
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
  id?: string;
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
  className?: string;
  exchange?: string;
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
  onPositionChanged: (order: Order, newPosition: number) => void;
}

// Simplify OrderRow to focus only on rendering the static content
export const OrderRow = memo(({ 
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
  onPositionChanged,
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
  onPositionChanged: (order: Order, newPosition: number) => void;
  [key: string]: any;
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  
  // Log order data for debugging
  useEffect(() => {
    console.log(`Rendering OrderRow for order:`, {
      id: order.id || order.advNo,
      price: order.price,
      amount: order.amount,
      type
    });
  }, [order, type]);
  
  // Add safe parsing for price and amount
  const safePrice = useMemo(() => {
    const price = Number(order.price);
    return isNaN(price) ? null : price;
  }, [order.price]);
  
  const safeAmount = useMemo(() => {
    const amount = Number(order.amount);
    return isNaN(amount) ? null : amount;
  }, [order.amount]);

  // Calculate delta with safe price
  const delta = useMemo(() => {
    if (!spotPrice || safePrice === null) return null;
    const diff = safePrice - spotPrice;
    const percentage = (diff / spotPrice) * 100;
    return { diff, percentage };
  }, [safePrice, spotPrice]);

  // Use useMemo for expensive calculations to prevent recalculation on re-render
  const merchantType = React.useMemo(() => {
    return getMerchantTypeDisplay(
      order.merchant.completedTrades,
      order.merchant.rating * 100,
      order.merchant.completionRate * 100
    ) as MerchantType;
  }, [order.merchant.completedTrades, order.merchant.rating, order.merchant.completionRate, getMerchantTypeDisplay]);

  // Memoize the rendered content to prevent unnecessary re-renders
  const priceCell = React.useMemo(() => {
    // Debug check for price validity
    const isValidPrice = typeof safePrice === 'number' && !isNaN(safePrice);
    const priceDisplay = isValidPrice 
      ? formatPrice(safePrice)
      : <span className="invalid-data">Invalid price</span>;
    
    return (
      <TableCell className={cn(
        "py-1 px-2 text-xs whitespace-nowrap",
        type === 'buy' ? "text-green-600" : "text-red-600",
        !isValidPrice ? "bg-red-100 dark:bg-red-900/30" : ""
      )}>
        <div className="flex flex-col">
          <span>{priceDisplay}</span>
          {isValidPrice && delta && (
            <div className="delta">
              <span>{formatDelta(delta.diff)}</span>
              <span>{delta.percentage > 0 ? '+' : ''}{delta.percentage.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </TableCell>
    );
  }, [formatPrice, safePrice, type, delta]);

  const amountCell = React.useMemo(() => {
    // Debug check for amount validity
    const isValidAmount = typeof safeAmount === 'number' && !isNaN(safeAmount);
    const amountDisplay = isValidAmount 
      ? `${formatAmount(safeAmount)} ${crypto}`
      : <span className="invalid-data">Invalid amount</span>;
    
    return (
      <TableCell className={cn(
        "py-1 px-2 text-xs whitespace-nowrap",
        !isValidAmount ? "bg-red-100 dark:bg-red-900/30" : ""
      )}>
        <div className="flex flex-col">
          <span>{amountDisplay}</span>
          <span className="text-[10px] text-muted-foreground">
            Limit: {formatLimit(order.minAmount, order.maxAmount)}
          </span>
        </div>
      </TableCell>
    );
  }, [formatAmount, formatLimit, safeAmount, order.minAmount, order.maxAmount, crypto]);

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
          <span className="text-[10px] text-muted-foreground">{formatLastOnline(order.merchant.lastOnlineTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{order.merchant.completedTrades} orders</span>
          <span>{formatPercent(order.merchant.rating * 100)}% pos</span>
          <span>{formatPercent(order.merchant.completionRate * 100)}% comp</span>
        </div>
      </div>
    </TableCell>
  ), [
    order.merchant.name, 
    order.merchant.rating, 
    order.merchant.completionRate,
    order.merchant.completedTrades,
    order.merchant.lastOnlineTime,
    merchantType,
    formatPercent,
    formatLastOnline
  ]);

  return (
    <TableRow 
      ref={rowRef}
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
export function OrderTable({
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
  spotPrice,
  onPositionChanged,
}: OrderTableProps) {
  // Debug logging of orders
  useEffect(() => {
    console.log(`${type} orders data:`, orders);
    if (orders && orders.length > 0) {
      const firstOrder = orders[0];
      console.log('First order sample:', {
        id: firstOrder.id || firstOrder.advNo,
        price: firstOrder.price,
        amount: firstOrder.amount
      });
    } else {
      console.log(`No ${type} orders available`);
    }
  }, [orders, type]);

  // Get a unique ID for an order, preferring id over advNo
  const getOrderId = useCallback((order: Order) => {
    return order.id || order.advNo;
  }, []);

  // Create title based on type
  const tableTitle = type === 'buy' ? "Buy Orders" : "Sell Orders";
  const titleColorClass = type === 'buy' ? "bg-green-500/10 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:bg-red-950/30 dark:text-red-400";

  return (
    <div className="order-table-container">
      <div className={`py-2 px-3 font-medium text-sm ${titleColorClass}`}>
        {tableTitle}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="header-row">
            <TableHead className="price-col">Price</TableHead>
            <TableHead className="amount-col">Amount</TableHead>
            <TableHead className="payment-col">Payment</TableHead>
            <TableHead className="merchant-col">Merchant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => {
              // Get a stable key for this order
              const orderId = getOrderId(order);
              
              return (
                <OrderRow
                  key={orderId}
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
                  spotPrice={spotPrice}
                  onPositionChanged={onPositionChanged}
                />
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                <div className="text-muted-foreground">No orders available</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const OrderBook = React.memo(({ 
  fiat,
  crypto,
  buyOrders = [],
  sellOrders = [],
  loading = false,
  error = null,
  hasChanges = false,
  spotPrice,
  className,
  exchange = 'binance',
  ...props
}: {
  fiat: string;
  crypto: string;
  buyOrders?: Order[];
  sellOrders?: Order[];
  loading?: boolean;
  error?: string | null;
  hasChanges?: boolean;
  spotPrice?: number;
  className?: string;
  exchange?: string;
  [key: string]: any;
}) => {
  const [currentSpotPrice, setCurrentSpotPrice] = useState<number | undefined>(spotPrice);
  const [spotLoading, setSpotLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Add debug validation for orders
  useEffect(() => {
    console.log('OrderBook received data:', {
      buyOrdersCount: buyOrders?.length || 0,
      sellOrdersCount: sellOrders?.length || 0,
      hasChanges,
      loading,
      error
    });

    // Validate our order data
    try {
      if (buyOrders && buyOrders.length > 0) {
        const firstBuyOrder = buyOrders[0];
        console.log('First buy order:', firstBuyOrder);
        
        // Check data validity
        if (!firstBuyOrder.id && !firstBuyOrder.advNo) {
          console.error('Invalid buy order: Missing ID/advNo', firstBuyOrder);
          setDebugInfo('Error: Buy orders have invalid structure - missing ID fields');
        }
      }
      
      if (sellOrders && sellOrders.length > 0) {
        const firstSellOrder = sellOrders[0];
        console.log('First sell order:', firstSellOrder);
        
        // Check data validity
        if (!firstSellOrder.id && !firstSellOrder.advNo) {
          console.error('Invalid sell order: Missing ID/advNo', firstSellOrder);
          setDebugInfo('Error: Sell orders have invalid structure - missing ID fields');
        }
      }
      
      if ((buyOrders?.length === 0 && sellOrders?.length === 0) && !loading && !error) {
        console.warn('Both buy and sell orders are empty, but no loading or error state.');
        setDebugInfo('Warning: No orders available, but no loading or error state.');
      }
    } catch (err: any) {
      console.error('Error validating order data:', err);
      setDebugInfo(`Error validating order data: ${err.message}`);
    }
  }, [buyOrders, sellOrders, hasChanges, loading, error]);

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

    // For USD to USDT or USD to USDC pairs, always use 1 as the spot price
    if (fiat === 'USD' && (crypto === 'USDT' || crypto === 'USDC')) {
      console.log(`Using fixed spot price of 1 for ${crypto}/${fiat}`);
      setCurrentSpotPrice(1);
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

  // Additional error state for empty orders
  const hasEmptyOrders = (!loading && !error && buyOrders.length === 0 && sellOrders.length === 0);

  if (loading) {
    return (
      <Card className={cn("col-span-1", className)}>
        <CardHeader className="px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <LineChart className="h-4 w-4" />
            {exchange.toUpperCase()} Order Book
            {currentSpotPrice && (
              <Badge variant="outline" className="bg-muted/50 text-xs rounded-sm px-1.5 py-0 h-5">
                Spot: {formatPrice(currentSpotPrice)}
              </Badge>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasChanges && !loading && (
              <Badge variant="outline" className="text-[9px] rounded-sm px-1 py-0 h-4">
                Updated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-4 text-center text-red-500">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              {error}
            </div>
          ) : debugInfo ? (
            <div className="p-4 text-center text-amber-500 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              {debugInfo}
            </div>
          ) : loading && (!buyOrders?.length || !sellOrders?.length) ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Loading order book...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-muted/30 divide-x divide-border">
              <OrderTable 
                orders={buyOrdersMemo}
                type="buy"
                crypto={crypto}
                {...formattingProps}
                spotPrice={currentSpotPrice}
                onPositionChanged={(order, newPosition) => {
                  // Implement the logic to update the position of the order in the table
                }}
              />
              <OrderTable 
                orders={sellOrdersMemo}
                type="sell"
                crypto={crypto}
                {...formattingProps}
                spotPrice={currentSpotPrice}
                onPositionChanged={(order, newPosition) => {
                  // Implement the logic to update the position of the order in the table
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("col-span-1", className)}>
        <CardHeader className="px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <LineChart className="h-4 w-4" />
            {exchange.toUpperCase()} Order Book
            {currentSpotPrice && (
              <Badge variant="outline" className="bg-muted/50 text-xs rounded-sm px-1.5 py-0 h-5">
                Spot: {formatPrice(currentSpotPrice)}
              </Badge>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasChanges && !loading && (
              <Badge variant="outline" className="text-[9px] rounded-sm px-1 py-0 h-4">
                Updated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 text-center text-red-500">
            <AlertTriangle className="h-4 w-4 inline-block mr-1" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasEmptyOrders) {
    return (
      <Card className={cn("col-span-1", className)}>
        <CardHeader className="px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <LineChart className="h-4 w-4" />
            {exchange.toUpperCase()} Order Book
            {currentSpotPrice && (
              <Badge variant="outline" className="bg-muted/50 text-xs rounded-sm px-1.5 py-0 h-5">
                Spot: {formatPrice(currentSpotPrice)}
              </Badge>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasChanges && !loading && (
              <Badge variant="outline" className="text-[9px] rounded-sm px-1 py-0 h-4">
                Updated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 text-center text-muted-foreground text-sm">
            <AlertTriangle className="h-4 w-4 inline-block mr-1" />
            No orders available for this pair. Try changing the currency pair.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("col-span-1", className)}>
      <CardHeader className="px-4 pt-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <LineChart className="h-4 w-4" />
          {exchange.toUpperCase()} Order Book
          {currentSpotPrice && (
            <Badge variant="outline" className="bg-muted/50 text-xs rounded-sm px-1.5 py-0 h-5">
              Spot: {formatPrice(currentSpotPrice)}
            </Badge>
          )}
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {hasChanges && !loading && (
            <Badge variant="outline" className="text-[9px] rounded-sm px-1 py-0 h-4">
              Updated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-4 text-center text-red-500">
            <AlertTriangle className="h-4 w-4 inline-block mr-1" />
            {error}
          </div>
        ) : debugInfo ? (
          <div className="p-4 text-center text-amber-500 text-sm">
            <AlertTriangle className="h-4 w-4 inline-block mr-1" />
            {debugInfo}
          </div>
        ) : loading && (!buyOrders?.length || !sellOrders?.length) ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading order book...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-muted/30 divide-x divide-border">
            <OrderTable 
              orders={buyOrdersMemo}
              type="buy"
              crypto={crypto}
              {...formattingProps}
              spotPrice={currentSpotPrice}
              onPositionChanged={(order, newPosition) => {
                // Implement the logic to update the position of the order in the table
              }}
            />
            <OrderTable 
              orders={sellOrdersMemo}
              type="sell"
              crypto={crypto}
              {...formattingProps}
              spotPrice={currentSpotPrice}
              onPositionChanged={(order, newPosition) => {
                // Implement the logic to update the position of the order in the table
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}); 