"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketOverview } from "@/components/market-overview";
import { OrderBookAnalysis } from "@/components/order-book-analysis";
import { SentimentAnalysis } from "@/components/sentiment-analysis";
import { TradingStrategies } from "@/components/trading-strategies";
import { PriceAlerts } from "@/components/price-alerts";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { Sidebar } from "@/components/sidebar";
import { OrderBook } from "@/components/order-book";
import { P2PComparison } from "@/components/p2p-comparison";
import { binanceP2PService } from "@/services/binanceP2PService";
import { okxP2PService } from "@/services/okxP2PService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

export default function DashboardPage() {
  const [exchange, setExchange] = useState('binance');
  const [fiat, setFiat] = useState('USD');
  const [crypto, setCrypto] = useState('USDT');
  const [orders, setOrders] = useState<{
    buyOrders: any[];
    sellOrders: any[];
    hasChanges?: boolean;
  }>({
    buyOrders: [],
    sellOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching orders from ${exchange}...`);
      
      // Select the appropriate service based on exchange
      const p2pService = exchange === 'okx' ? okxP2PService : binanceP2PService;
      
      const data = await p2pService.getOrders(fiat, crypto);
      console.log(`${exchange.toUpperCase()} orders fetched successfully:`, {
        buyOrdersCount: data.buyOrders.length,
        sellOrdersCount: data.sellOrders.length
      });
      setOrders(data);
    } catch (err: any) {
      console.error(`Error in fetchOrders from ${exchange}:`, err);
      setError(err.message || `Failed to fetch orders from ${exchange}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [fiat, crypto, exchange]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Set up polling
    const intervalId = setInterval(fetchOrders, POLLING_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-shrink-0">
        <Sidebar
          exchange={exchange}
          fiat={fiat}
          crypto={crypto}
          onExchangeChange={setExchange}
          onFiatChange={setFiat}
          onCryptoChange={setCrypto}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <DashboardShell>
          <DashboardHeader
            exchange={exchange}
            fiat={fiat}
            crypto={crypto}
          />
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="order-book">Order Book</TabsTrigger>
                <TabsTrigger value="p2p-comparison">P2P Comparison</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MarketOverview 
                    exchange={exchange}
                    fiat={fiat}
                    crypto={crypto}
                  />
                  <OrderBookAnalysis 
                    exchange={exchange}
                    fiat={fiat}
                    crypto={crypto}
                  />
                </div>
              </TabsContent>
              <TabsContent value="order-book">
                <OrderBook 
                  fiat={fiat} 
                  crypto={crypto} 
                  buyOrders={orders.buyOrders}
                  sellOrders={orders.sellOrders}
                  loading={loading}
                  error={error}
                  hasChanges={orders.hasChanges}
                  exchange={exchange}
                />
              </TabsContent>
              <TabsContent value="p2p-comparison">
                <P2PComparison 
                  fiat={fiat}
                  crypto={crypto}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
} 