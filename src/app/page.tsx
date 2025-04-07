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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
    sellOrders: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(['all']);

  // Get unique payment methods from orders
  const getPaymentMethods = (orders: { buyOrders: any[]; sellOrders: any[] }) => {
    const methods = new Set<string>();
    methods.add('all');
    
    [...orders.buyOrders, ...orders.sellOrders].forEach(order => {
      if (order.paymentMethods) {
        order.paymentMethods.forEach((method: string) => methods.add(method));
      }
    });
    
    return Array.from(methods);
  };

  // Filter orders based on selected payment methods
  const getFilteredOrders = (orders: { buyOrders: any[]; sellOrders: any[] }, selectedPaymentMethods: string[]) => {
    if (selectedPaymentMethods.includes('all')) {
      return orders;
    }

    return {
      buyOrders: orders.buyOrders.filter(order => 
        order.paymentMethods && order.paymentMethods.some((method: string) => selectedPaymentMethods.includes(method))
      ),
      sellOrders: orders.sellOrders.filter(order => 
        order.paymentMethods && order.paymentMethods.some((method: string) => selectedPaymentMethods.includes(method))
      )
    };
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const p2pService = exchange === 'okx' ? okxP2PService : binanceP2PService;
        const data = await p2pService.getOrders(fiat, crypto);
        setOrders(prev => ({
          ...data,
          hasChanges: JSON.stringify(data) !== JSON.stringify(prev)
        }));
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [exchange, fiat, crypto]);

  const paymentMethodOptions = getPaymentMethods(orders);
  const filteredOrders = getFilteredOrders(orders, selectedPaymentMethods);

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
              <TabsList className="bg-palette-macadamiaBeige dark:bg-palette-norfolkGreen">
                <TabsTrigger value="overview" className="data-[state=active]:bg-palette-fenceGreen data-[state=active]:text-palette-venetianLace">Overview</TabsTrigger>
                <TabsTrigger value="order-book" className="data-[state=active]:bg-palette-fenceGreen data-[state=active]:text-palette-venetianLace">Order Book</TabsTrigger>
                <TabsTrigger value="p2p-comparison" className="data-[state=active]:bg-palette-fenceGreen data-[state=active]:text-palette-venetianLace">P2P Comparison</TabsTrigger>
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
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div>
                        <Label>Payment Methods:</Label>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentMethods(['all'])}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                              selectedPaymentMethods.includes('all')
                                ? "bg-palette-fieryGlow text-palette-venetianLace border-palette-fieryGlow"
                                : "bg-background hover:bg-palette-pumpkinVapor hover:text-palette-fenceGreen border-input"
                            )}
                          >
                            All
                          </button>
                          {paymentMethodOptions
                            .filter(method => method !== 'all')
                            .map((method: string) => (
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
                                    ? "bg-palette-fieryGlow text-palette-venetianLace border-palette-fieryGlow"
                                    : "bg-background hover:bg-palette-pumpkinVapor hover:text-palette-fenceGreen border-input"
                                )}
                              >
                                {method}
                              </button>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <OrderBook 
                    fiat={fiat} 
                    crypto={crypto} 
                    buyOrders={filteredOrders.buyOrders}
                    sellOrders={filteredOrders.sellOrders}
                    loading={loading}
                    error={error}
                    hasChanges={orders.hasChanges}
                    exchange={exchange}
                  />
                </div>
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