import React, { useState, useCallback, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { OrderBook } from '@/components/order-book';
import { BinanceP2PService } from '@/services/binanceP2PService';
import { P2POrder, P2POrdersResponse, OrderType } from '@/types/p2p';

export default function P2PPage() {
  const [orders, setOrders] = useState<P2POrdersResponse>({ buyOrders: [], sellOrders: [], hasChanges: false, hasMore: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<P2POrder | null>(null);

  const loadOrders = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const binanceService = new BinanceP2PService();
      const newOrders = await binanceService.getOrders('USD', 'USDT', pageNum);

      if (pageNum === 1) {
        setOrders(newOrders);
      } else {
        setOrders((prev: P2POrdersResponse) => ({
          buyOrders: [...prev.buyOrders, ...newOrders.buyOrders],
          sellOrders: [...prev.sellOrders, ...newOrders.sellOrders],
          hasChanges: newOrders.hasChanges,
          hasMore: newOrders.hasMore
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && orders.hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage);
    }
  }, [isLoading, orders.hasMore, page, loadOrders]);

  const handleOrderSelect = useCallback((order: P2POrder, type: OrderType) => {
    setSelectedOrder(order);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">P2P Market</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <OrderBook
          buyOrders={orders.buyOrders}
          sellOrders={orders.sellOrders}
          onOrderSelect={handleOrderSelect}
          selectedOrder={selectedOrder}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          hasMore={orders.hasMore}
        />
      </div>
    </div>
  );
} 