import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { binanceP2PService } from '@/services/binanceP2PService';
import { okxP2PService } from '@/services/okxP2PService';

type Filters = {
  minSpread: number;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  minUserRating: number;
  minCompletedTrades: number;
};

interface ArbitrageOpportunity {
  id: string;
  buyExchange: string;
  sellExchange: string;
  crypto: string;
  fiat: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  minAmount: number;
  maxAmount: number;
  buyPaymentMethods: string[];
  sellPaymentMethods: string[];
  timestamp: number;
}

interface OrderBookComparison {
  leftExchange: string;
  rightExchange: string;
  crypto: string;
  fiat: string;
  leftOrders: any[];
  rightOrders: any[];
  spreads: ArbitrageOpportunity[];
}

export function ArbitrageDashboard() {
  const [comparison, setComparison] = useState<OrderBookComparison>({
    leftExchange: 'binance',
    rightExchange: 'okx',
    crypto: 'USDT',
    fiat: 'USD',
    leftOrders: [],
    rightOrders: [],
    spreads: []
  });

  const [filters, setFilters] = useState<Filters>({
    minSpread: 0.5,
    minAmount: 100,
    maxAmount: 10000,
    paymentMethods: [],
    minUserRating: 0.95,
    minCompletedTrades: 100
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const [binanceOrders, okxOrders] = await Promise.all([
          binanceP2PService.getOrders(comparison.fiat, comparison.crypto),
          okxP2PService.getOrders(comparison.fiat, comparison.crypto)
        ]);

        const leftOrders = comparison.leftExchange === 'binance' ? binanceOrders : okxOrders;
        const rightOrders = comparison.rightExchange === 'binance' ? binanceOrders : okxOrders;

        setComparison(prev => ({
          ...prev,
          leftOrders: leftOrders.buyOrders,
          rightOrders: rightOrders.sellOrders
        }));

        // Calculate arbitrage opportunities
        const opportunities = calculateArbitrageOpportunities(
          leftOrders.buyOrders,
          rightOrders.sellOrders,
          filters
        );

        setComparison(prev => ({
          ...prev,
          spreads: opportunities
        }));
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [comparison.fiat, comparison.crypto, comparison.leftExchange, comparison.rightExchange, filters]);

  const calculateArbitrageOpportunities = (
    buyOrders: any[],
    sellOrders: any[],
    currentFilters: Filters
  ): ArbitrageOpportunity[] => {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        // Skip if user ratings or completed trades don't meet criteria
        if (
          buyOrder.merchant.rating < currentFilters.minUserRating ||
          sellOrder.merchant.rating < currentFilters.minUserRating ||
          buyOrder.merchant.completedTrades < currentFilters.minCompletedTrades ||
          sellOrder.merchant.completedTrades < currentFilters.minCompletedTrades
        ) {
          continue;
        }

        const spread = sellOrder.price - buyOrder.price;
        const spreadPercentage = (spread / buyOrder.price) * 100;

        if (spreadPercentage >= currentFilters.minSpread) {
          const minAmount = Math.max(
            buyOrder.minAmount,
            sellOrder.minAmount,
            currentFilters.minAmount
          );
          const maxAmount = Math.min(
            buyOrder.maxAmount,
            sellOrder.maxAmount,
            currentFilters.maxAmount
          );

          if (maxAmount >= minAmount) {
            opportunities.push({
              id: `${buyOrder.id}-${sellOrder.id}`,
              buyExchange: comparison.leftExchange,
              sellExchange: comparison.rightExchange,
              crypto: comparison.crypto,
              fiat: comparison.fiat,
              buyPrice: buyOrder.price,
              sellPrice: sellOrder.price,
              spread,
              spreadPercentage,
              minAmount,
              maxAmount,
              buyPaymentMethods: buyOrder.paymentMethods,
              sellPaymentMethods: sellOrder.paymentMethods,
              timestamp: Date.now()
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.spreadPercentage - a.spreadPercentage);
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="orderbook" className="w-full">
        <TabsList>
          <TabsTrigger value="orderbook">Order Book Comparison</TabsTrigger>
          <TabsTrigger value="signals">Arbitrage Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="orderbook">
          <Card>
            <CardHeader>
              <CardTitle>Order Book Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Left Exchange</Label>
                  <Select
                    value={comparison.leftExchange}
                    onValueChange={(value: string) => setComparison(prev => ({ ...prev, leftExchange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="okx">OKX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Right Exchange</Label>
                  <Select
                    value={comparison.rightExchange}
                    onValueChange={(value: string) => setComparison(prev => ({ ...prev, rightExchange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="okx">OKX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label>Filters</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label>Min Spread (%)</Label>
                    <Input
                      type="number"
                      value={filters.minSpread}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minSpread: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Min Amount</Label>
                    <Input
                      type="number"
                      value={filters.minAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minAmount: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Max Amount</Label>
                    <Input
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Min User Rating</Label>
                    <Input
                      type="number"
                      value={filters.minUserRating}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minUserRating: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Arbitrage Opportunities</h3>
                <div className="space-y-2">
                  {comparison.spreads.map((opportunity) => (
                    <Card key={opportunity.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {opportunity.buyExchange.toUpperCase()} → {opportunity.sellExchange.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {opportunity.crypto}/{opportunity.fiat}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-semibold">
                              {opportunity.spreadPercentage.toFixed(2)}% spread
                            </p>
                            <p className="text-sm">
                              {opportunity.minAmount} - {opportunity.maxAmount} {opportunity.fiat}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle>Arbitrage Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="telegram-notifications" />
                  <Label htmlFor="telegram-notifications">Enable Telegram Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" />
                  <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                </div>
                <Button>Configure Notifications</Button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Recent Signals</h3>
                <div className="space-y-2">
                  {comparison.spreads.map((opportunity) => (
                    <Card key={opportunity.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">
                              {opportunity.buyExchange.toUpperCase()} → {opportunity.sellExchange.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {opportunity.crypto}/{opportunity.fiat}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-semibold">
                              {opportunity.spreadPercentage.toFixed(2)}% spread
                            </p>
                            <p className="text-sm">
                              {new Date(opportunity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 