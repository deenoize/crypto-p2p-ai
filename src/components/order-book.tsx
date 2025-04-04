import React, { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, LineChart, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInView } from 'react-intersection-observer';
import { P2POrder, OrderType } from '@/types/p2p';

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

type MerchantType = 'M_LEVEL_1' | 'M_LEVEL_2' | 'M_LEVEL_3' | 'M_LEVEL_4';

const MERCHANT_BADGES = {
  'M_LEVEL_1': {
    icon: '🥉',
    color: '#CD7F32',
    label: 'Bronze Merchant'
  },
  'M_LEVEL_2': {
    icon: '🥈',
    color: '#C0C0C0',
    label: 'Silver Merchant'
  },
  'M_LEVEL_3': {
    icon: '🥇',
    color: '#FFD700',
    label: 'Gold Merchant'
  },
  'M_LEVEL_4': {
    icon: '🛡️',
    color: '#FF0000',
    label: 'Block Merchant'
  }
} as const;

// Add user type color mapping
const USER_TYPE_COLORS: Record<string, string> = {
  'user': 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300',
  'merchant': 'bg-purple-500/15 text-purple-700 dark:bg-purple-400/20 dark:text-purple-300',
  'verified': 'bg-green-500/15 text-green-700 dark:bg-green-400/20 dark:text-green-300',
  'block': 'bg-red-500/15 text-red-700 dark:bg-red-400/20 dark:text-red-300',
  'all': 'bg-gray-500/15 text-gray-700 dark:bg-gray-400/20 dark:text-gray-300',
  'common': 'bg-gray-500/15 text-gray-700 dark:bg-gray-400/20 dark:text-gray-300'
};

// Add function to format user type display
function formatUserType(userType: string): string {
  switch (userType) {
    case 'user':
      return 'Regular User';
    case 'merchant':
      return 'Merchant';
    case 'verified':
      return 'Verified';
    case 'block':
      return 'Block Merchant';
    case 'all':
      return 'All Types';
    case 'common':
      return 'Common User';
    default:
      return userType;
  }
}

function getPaymentMethodColor(method: string): string {
  if (!paymentMethodColorCache.has(method)) {
    // Use the method name to consistently pick a color from the palette
    const index = Array.from(method).reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLOR_PALETTE.length;
    paymentMethodColorCache.set(method, COLOR_PALETTE[index]);
  }
  return paymentMethodColorCache.get(method) || 'bg-neutral-500/15 text-neutral-700 dark:bg-neutral-400/20 dark:text-neutral-300';
}

interface Order extends P2POrder {}

interface OrderBookProps {
  fiat: string;
  crypto: string;
  buyOrders: P2POrder[];
  sellOrders: P2POrder[];
  loading?: boolean;
  error?: string | null;
  hasChanges?: boolean;
  spotPrice?: number;
  className?: string;
  exchange?: string;
  selectedPaymentMethod?: string;
  onOrderSelect?: (order: P2POrder, type: OrderType) => void;
  selectedOrder?: P2POrder | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

interface OrderTableProps {
  orders: P2POrder[];
  type: OrderType;
  crypto: string;
  formatPrice: (price: number) => string;
  formatAmount: (amount: number) => string;
  formatLimit: (min: number, max: number) => string;
  formatPercent: (value: number) => string;
  formatLastOnline: (lastOnlineTime: number) => string;
  getMerchantTypeDisplay: (completedTrades: number, rating: number, completionRate: number) => string;
  formatDelta: (price: number, reference?: number) => string | null;
  spotPrice?: number;
  onPositionChanged: (order: P2POrder, newPosition: number) => void;
  onOrderSelect?: (order: P2POrder, type: OrderType) => void;
  selectedBuyOrder?: P2POrder | null;
  selectedSellOrder?: P2POrder | null;
}

interface PaymentMethodSelectorProps {
  paymentMethods: string[];
  selectedPaymentMethods: string[];
  onPaymentMethodSelect: (method: string) => void;
}

function PaymentMethodSelector({ paymentMethods, selectedPaymentMethods, onPaymentMethodSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        variant="outline"
        className={cn(
          "payment-method-badge px-2 py-0.5 cursor-pointer",
          selectedPaymentMethods.includes('all') ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        )}
        onClick={() => onPaymentMethodSelect('all')}
      >
        All
      </Badge>
      {paymentMethods.filter(method => method !== 'all').map((method) => (
        <Badge
          key={method}
          variant="outline"
          className={cn(
            "payment-method-badge px-2 py-0.5 cursor-pointer",
            selectedPaymentMethods.includes(method) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
          onClick={() => onPaymentMethodSelect(method)}
        >
          {method}
        </Badge>
      ))}
    </div>
  );
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
  onSelect,
  isSelected,
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
  onSelect?: () => void;
  isSelected?: boolean;
  [key: string]: any;
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  
  // Log order data for debugging
  useEffect(() => {
    console.log(`Rendering OrderRow for order:`, {
      advNo: order.advNo,
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

  const merchantCell = React.useMemo(() => (order: Order) => {
    const badge = order.merchant.userIdentity ? MERCHANT_BADGES[order.merchant.userIdentity as MerchantType] : null;

    return (
      <TableCell className="py-1 px-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs truncate">{order.merchant.name}</span>
              {badge && (
                <span 
                  className="inline-flex items-center justify-center w-4 h-4 text-xs"
                  title={badge.label}
                  style={{ color: badge.color }}
                >
                  {badge.icon}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{formatLastOnline(order.merchant.lastOnlineTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{order.merchant.completedTrades} orders</span>
            <span>{formatPercent(order.merchant.rating * 100)}% pos</span>
            <span>{formatPercent(order.merchant.completionRate * 100)}% comp</span>
          </div>
        </div>
      </TableCell>
    );
  }, [formatLastOnline, formatPercent]);

  return (
    <TableRow 
      ref={rowRef}
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted/70 border-l-2 border-l-primary",
        className
      )}
      onClick={() => {
        console.log('Order clicked:', {
          advNo: order.advNo,
          type,
          isSelected
        });
        onSelect?.();
      }}
      {...props}
    >
      {priceCell}
      {amountCell}
      {paymentCell}
      {merchantCell(order)}
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Change the memoization comparator to include spot price changes
  return (
    prevProps.order.advNo === nextProps.order.advNo && 
    prevProps.spotPrice === nextProps.spotPrice
  );
});

const getOrderKey = (order: P2POrder) => order.advNo;

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
  onOrderSelect,
  selectedBuyOrder,
  selectedSellOrder,
}: OrderTableProps) {
  const [ordersState, setOrdersState] = useState(orders);

  useEffect(() => {
    setOrdersState(orders);
  }, [orders]);

  const handleOrderSelect = useCallback((order: Order) => {
    if (onOrderSelect) {
      onOrderSelect(order, type);
    }
  }, [onOrderSelect, type]);

  const isOrderSelected = useCallback((order: Order) => {
    if (type === 'buy') {
      return selectedBuyOrder?.advNo === order.advNo;
    } else {
      return selectedSellOrder?.advNo === order.advNo;
    }
  }, [selectedBuyOrder, selectedSellOrder, type]);

  if (!ordersState.length) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No orders available for this pair
      </div>
    );
  }

  const ordersStateMemo = React.useMemo(() => ordersState.map((order) => ({
    ...order,
    key: getOrderKey(order)
  })), [ordersState]);

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Merchant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersStateMemo.map((order, index) => (
            <OrderRow
              key={`${order.key}-${index}`}
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
              onPositionChanged={(order) => onPositionChanged(order, index)}
              onSelect={() => handleOrderSelect(order)}
              isSelected={isOrderSelected(order)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Adding a component to display mock data notice
const MockDataNotice = ({ visible = false, reason = '' }) => {
  if (!visible) return null;
  
  return (
    <div className="rounded-md p-3 mb-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
            Using Mock Data
          </h3>
          <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            <p>{reason || "This data is simulated and does not represent real market conditions."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function OrderBook({
  fiat,
  crypto,
  buyOrders,
  sellOrders,
  loading = false,
  error = null,
  hasChanges = false,
  spotPrice,
  className,
  exchange,
  selectedPaymentMethod = 'all',
  onOrderSelect,
  selectedOrder,
  onLoadMore,
  hasMore
}: OrderBookProps) {
  const [currentSpotPrice, setCurrentSpotPrice] = useState<number | undefined>(spotPrice);
  const [spotLoading, setSpotLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [mockReason, setMockReason] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(['all']);
  const { ref: loadMoreRef, inView } = useInView();

  // Get unique payment methods from all orders
  const paymentMethodOptions = useMemo(() => {
    const methods = new Set<string>();
    methods.add('all');
    
    [...buyOrders, ...sellOrders].forEach(order => {
      if (order.paymentMethods) {
        order.paymentMethods.forEach(method => methods.add(method));
      }
    });
    
    return Array.from(methods);
  }, [buyOrders, sellOrders]);

  // Filter orders based on selected payment methods
  const filteredBuyOrders = useMemo(() => {
    if (selectedPaymentMethods.includes('all')) return buyOrders;
    return buyOrders.filter(order => 
      order.paymentMethods.some(method => selectedPaymentMethods.includes(method))
    );
  }, [buyOrders, selectedPaymentMethods]);

  const filteredSellOrders = useMemo(() => {
    if (selectedPaymentMethods.includes('all')) return sellOrders;
    return sellOrders.filter(order => 
      order.paymentMethods.some(method => selectedPaymentMethods.includes(method))
    );
  }, [sellOrders, selectedPaymentMethods]);

  // Check if we're using mock data
  useEffect(() => {
    if (buyOrders && buyOrders.length > 0) {
      // Check for mock data indicators in the order ID/advNo
      const firstOrder = buyOrders[0];
      if (firstOrder.advNo && (firstOrder.advNo.includes('mock') || firstOrder.advNo.includes('okx-mock'))) {
        setIsMockData(true);
        setMockReason(exchange === 'okx' 
          ? "OKX P2P API endpoints are not publicly accessible. Using generated mock data instead." 
          : "Using generated mock data for demonstration purposes.");
      } else {
        setIsMockData(false);
        setMockReason('');
      }
    }
  }, [buyOrders, exchange]);

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
        if (!firstBuyOrder.advNo) {
          console.error('Invalid buy order: Missing advNo', firstBuyOrder);
          setDebugInfo('Error: Buy orders have invalid structure - missing advNo field');
        }
      }
      
      if (sellOrders && sellOrders.length > 0) {
        const firstSellOrder = sellOrders[0];
        console.log('First sell order:', firstSellOrder);
        
        // Check data validity
        if (!firstSellOrder.advNo) {
          console.error('Invalid sell order: Missing advNo', firstSellOrder);
          setDebugInfo('Error: Sell orders have invalid structure - missing advNo field');
        }
      }
      
      // Only show the warning if we've received the initial data and there are no orders
      if (!loading && !error && buyOrders && sellOrders && 
          Array.isArray(buyOrders) && Array.isArray(sellOrders) &&
          buyOrders.length === 0 && sellOrders.length === 0) {
        console.warn('Both buy and sell orders are empty, but no loading or error state.');
        setDebugInfo('Warning: No orders available, but no loading or error state.');
      } else {
        setDebugInfo(null);
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

  // Improved memoization strategy for orders that considers only advNo changes
  const buyOrdersWithKeys = React.useMemo(() => buyOrders.map((order) => ({
    ...order,
    key: order.advNo
  })), [buyOrders]);

  const sellOrdersWithKeys = React.useMemo(() => sellOrders.map((order) => ({
    ...order,
    key: order.advNo
  })), [sellOrders]);
  
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

  useEffect(() => {
    if (inView && hasMore && !spotLoading) {
      onLoadMore?.();
    }
  }, [inView, hasMore, spotLoading, onLoadMore]);

  if (loading) {
    return (
      <Card className={cn("col-span-1", className)}>
        <CardHeader className="px-4 pt-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <LineChart className="h-4 w-4" />
            {exchange ? `${exchange.toUpperCase()} ` : ''}Order Book
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
            <div className={cn(
              "grid gap-0 bg-muted/30 divide-x divide-border",
              (buyOrdersWithKeys.length > 0 && sellOrdersWithKeys.length > 0) ? "grid-cols-2" : "grid-cols-1"
            )}>
              {buyOrdersWithKeys.length > 0 && (
                <OrderTable 
                  orders={buyOrdersWithKeys}
                  type="buy"
                  crypto={crypto}
                  {...formattingProps}
                  spotPrice={currentSpotPrice}
                  onPositionChanged={(order, newPosition) => {
                    // Implement the logic to update the position of the order in the table
                  }}
                  onOrderSelect={onOrderSelect}
                  selectedBuyOrder={selectedOrder}
                  selectedSellOrder={selectedOrder}
                />
              )}
              {sellOrdersWithKeys.length > 0 && (
                <OrderTable 
                  orders={sellOrdersWithKeys}
                  type="sell"
                  crypto={crypto}
                  {...formattingProps}
                  spotPrice={currentSpotPrice}
                  onPositionChanged={(order, newPosition) => {
                    // Implement the logic to update the position of the order in the table
                  }}
                  onOrderSelect={onOrderSelect}
                  selectedBuyOrder={selectedOrder}
                  selectedSellOrder={selectedOrder}
                />
              )}
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
            {exchange ? `${exchange.toUpperCase()} ` : ''}Order Book
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
            {exchange ? `${exchange.toUpperCase()} ` : ''}Order Book
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
          {exchange ? `${exchange.toUpperCase()} ` : ''}Order Book
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
        <div className="px-4 pt-4">
          <MockDataNotice visible={isMockData} reason={mockReason} />
        </div>
        
        {debugInfo && (
          <div className="p-4 text-center text-amber-500 text-sm">
            <AlertTriangle className="h-4 w-4 inline-block mr-1" />
            {debugInfo}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedPaymentMethods(['all'])}
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                selectedPaymentMethods.includes('all')
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              )}
            >
              All
            </button>
            {paymentMethodOptions.filter(method => method !== 'all').map((method: string) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setSelectedPaymentMethods(prev => {
                    const newMethods = prev.includes('all')
                      ? [method]
                      : prev.includes(method)
                        ? prev.filter(m => m !== method)
                        : [...prev, method];
                    return newMethods.length ? newMethods : ['all'];
                  });
                }}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                  selectedPaymentMethods.includes(method)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                )}
              >
                {method}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buy Orders</CardTitle>
                <PaymentMethodSelector
                  paymentMethods={paymentMethodOptions}
                  selectedPaymentMethods={selectedPaymentMethods}
                  onPaymentMethodSelect={(method) => {
                    setSelectedPaymentMethods(prev => {
                      if (prev.includes('all')) {
                        return ['all'];
                      } else if (prev.includes(method)) {
                        return prev.filter(m => m !== method);
                      } else {
                        return [...prev, method];
                      }
                    });
                  }}
                />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {filteredBuyOrders.map((order, index) => (
                      <TableRow
                        key={`${getOrderKey(order)}-${index}`}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedOrder?.advNo === order.advNo && "bg-muted"
                        )}
                        onClick={() => onOrderSelect?.(order, 'buy')}
                      >
                        <TableCell className="w-[100px]">
                          {order.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {order.amount.toLocaleString()} {crypto}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-full">
                            {order.paymentMethods.map((method, i) => (
                              <Badge 
                                key={`${order.advNo}-${i}`}
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
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="font-medium text-xs truncate">{order.merchant.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatLastOnline(order.merchant.lastOnlineTime)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {hasMore && (
                      <TableRow ref={loadMoreRef}>
                        <TableCell colSpan={5} className="text-center py-4">
                          {spotLoading ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Loading more orders...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sell Orders</CardTitle>
                <PaymentMethodSelector
                  paymentMethods={paymentMethodOptions}
                  selectedPaymentMethods={selectedPaymentMethods}
                  onPaymentMethodSelect={(method) => {
                    setSelectedPaymentMethods(prev => {
                      if (prev.includes('all')) {
                        return ['all'];
                      } else if (prev.includes(method)) {
                        return prev.filter(m => m !== method);
                      } else {
                        return [...prev, method];
                      }
                    });
                  }}
                />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {filteredSellOrders.map((order, index) => (
                      <TableRow
                        key={`${getOrderKey(order)}-${index}`}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedOrder?.advNo === order.advNo && "bg-muted"
                        )}
                        onClick={() => onOrderSelect?.(order, 'sell')}
                      >
                        <TableCell className="w-[100px]">
                          {order.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {order.amount.toLocaleString()} {crypto}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-full">
                            {order.paymentMethods.map((method, i) => (
                              <Badge 
                                key={`${order.advNo}-${i}`}
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
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="font-medium text-xs truncate">{order.merchant.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatLastOnline(order.merchant.lastOnlineTime)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {hasMore && (
                      <TableRow ref={loadMoreRef}>
                        <TableCell colSpan={5} className="text-center py-4">
                          {spotLoading ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Loading more orders...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 