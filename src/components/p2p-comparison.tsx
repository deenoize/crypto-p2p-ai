"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { binanceP2PService } from '@/services/binanceP2PService';
import { okxP2PService } from '@/services/okxP2PService';
import { OrderBook } from './order-book';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface P2PComparisonProps {
  fiat: string;
  crypto: string;
}

type OrderType = 'all' | 'buy' | 'sell';

interface ComparisonState {
  leftExchange: string;
  rightExchange: string;
  leftOrders: {
    buyOrders: any[];
    sellOrders: any[];
    hasChanges?: boolean;
  };
  rightOrders: {
    buyOrders: any[];
    sellOrders: any[];
    hasChanges?: boolean;
  };
  leftOrderType: OrderType;
  rightOrderType: OrderType;
  leftPaymentMethods: string[];
  rightPaymentMethods: string[];
  isLoading: boolean;
  error: string | null;
}

export function P2PComparison({ fiat, crypto }: P2PComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonState>({
    leftExchange: 'binance',
    rightExchange: 'okx',
    leftOrders: {
      buyOrders: [],
      sellOrders: []
    },
    rightOrders: {
      buyOrders: [],
      sellOrders: []
    },
    leftOrderType: 'all',
    rightOrderType: 'all',
    leftPaymentMethods: ['all'],
    rightPaymentMethods: ['all'],
    isLoading: false,
    error: null
  });

  // Get unique payment methods from orders based on order type
  const getPaymentMethods = (orders: { buyOrders: any[]; sellOrders: any[] }, orderType: OrderType) => {
    const methods = new Set<string>();
    methods.add('all');
    
    if (orderType === 'all' || orderType === 'buy') {
      orders.buyOrders.forEach(order => {
        order.paymentMethods.forEach((method: string) => methods.add(method));
      });
    }
    
    if (orderType === 'all' || orderType === 'sell') {
      orders.sellOrders.forEach(order => {
        order.paymentMethods.forEach((method: string) => methods.add(method));
      });
    }
    
    return Array.from(methods);
  };

  const leftPaymentMethodOptions = getPaymentMethods(comparison.leftOrders, comparison.leftOrderType);
  const rightPaymentMethodOptions = getPaymentMethods(comparison.rightOrders, comparison.rightOrderType);

  useEffect(() => {
    const fetchOrders = async () => {
      setComparison(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const [binanceOrders, okxOrders] = await Promise.all([
          binanceP2PService.getOrders(fiat, crypto),
          okxP2PService.getOrders(fiat, crypto)
        ]);

        setComparison(prev => {
          const leftOrders = prev.leftExchange === 'binance' ? binanceOrders : okxOrders;
          const rightOrders = prev.rightExchange === 'binance' ? binanceOrders : okxOrders;
          
          return {
            ...prev,
            leftOrders,
            rightOrders,
            isLoading: false
          };
        });
      } catch (error) {
        setComparison(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch orders',
          isLoading: false
        }));
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fiat, crypto, comparison.leftExchange, comparison.rightExchange]);

  // When order type changes, reset payment methods to 'all' if current methods aren't available
  const updatePaymentMethods = (side: 'left' | 'right') => {
    const options = side === 'left' ? leftPaymentMethodOptions : rightPaymentMethodOptions;
    const currentMethods = side === 'left' ? comparison.leftPaymentMethods : comparison.rightPaymentMethods;
    
    // Check if any of the current methods (except 'all') are no longer available
    const shouldReset = currentMethods.some(method => 
      method !== 'all' && !options.includes(method)
    );

    if (shouldReset) {
      setComparison(prev => ({
        ...prev,
        [side === 'left' ? 'leftPaymentMethods' : 'rightPaymentMethods']: ['all']
      }));
    }
  };

  useEffect(() => {
    updatePaymentMethods('left');
    updatePaymentMethods('right');
  }, [comparison.leftOrderType, comparison.rightOrderType]);

  // Filter orders based on selected order type and payment methods
  const getFilteredOrders = (orders: { buyOrders: any[]; sellOrders: any[] }, orderType: OrderType, selectedPaymentMethods: string[]) => {
    let filteredOrders = { ...orders };

    // First filter by order type
    switch (orderType) {
      case 'buy':
        filteredOrders = {
          buyOrders: orders.buyOrders,
          sellOrders: []
        };
        break;
      case 'sell':
        filteredOrders = {
          buyOrders: [],
          sellOrders: orders.sellOrders
        };
        break;
    }

    // Then filter by payment methods if not just 'all'
    if (!selectedPaymentMethods.includes('all')) {
      filteredOrders = {
        buyOrders: filteredOrders.buyOrders.filter(order => 
          order.paymentMethods.some((method: string) => selectedPaymentMethods.includes(method))
        ),
        sellOrders: filteredOrders.sellOrders.filter(order => 
          order.paymentMethods.some((method: string) => selectedPaymentMethods.includes(method))
        )
      };
    }

    return filteredOrders;
  };

  const leftFilteredOrders = getFilteredOrders(
    comparison.leftOrders, 
    comparison.leftOrderType,
    comparison.leftPaymentMethods
  );
  
  const rightFilteredOrders = getFilteredOrders(
    comparison.rightOrders, 
    comparison.rightOrderType,
    comparison.rightPaymentMethods
  );

  const handleLeftOrderTypeChange = (value: string) => {
    setComparison(prev => ({ ...prev, leftOrderType: value as OrderType }));
  };

  const handleRightOrderTypeChange = (value: string) => {
    setComparison(prev => ({ ...prev, rightOrderType: value as OrderType }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>P2P Exchange Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">{comparison.leftExchange.toUpperCase()}</h3>
              <div className="space-y-4">
                <div>
                  <Tabs
                    value={comparison.leftOrderType}
                    onValueChange={handleLeftOrderTypeChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="buy">Buy</TabsTrigger>
                      <TabsTrigger value="sell">Sell</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <Label>Methods:</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setComparison(prev => ({ ...prev, leftPaymentMethods: ['all'] }));
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                        comparison.leftPaymentMethods.includes('all')
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      All
                    </button>
                    {leftPaymentMethodOptions.filter(method => method !== 'all').map((method: string) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setComparison(prev => {
                            const newMethods = prev.leftPaymentMethods.includes('all')
                              ? [method]
                              : prev.leftPaymentMethods.includes(method)
                                ? prev.leftPaymentMethods.filter(m => m !== method)
                                : [...prev.leftPaymentMethods, method];
                            return { ...prev, leftPaymentMethods: newMethods.length ? newMethods : ['all'] };
                          });
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                          comparison.leftPaymentMethods.includes(method)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <OrderBook
                  fiat={fiat}
                  crypto={crypto}
                  buyOrders={leftFilteredOrders.buyOrders}
                  sellOrders={leftFilteredOrders.sellOrders}
                  loading={comparison.isLoading}
                  error={comparison.error}
                  exchange={comparison.leftExchange}
                  hasChanges={comparison.leftOrders.hasChanges}
                  className="w-full"
                />
              </div>
            </div>
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">{comparison.rightExchange.toUpperCase()}</h3>
              <div className="space-y-4">
                <div>
                  <Tabs
                    value={comparison.rightOrderType}
                    onValueChange={handleRightOrderTypeChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="buy">Buy</TabsTrigger>
                      <TabsTrigger value="sell">Sell</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <Label>Methods:</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setComparison(prev => ({ ...prev, rightPaymentMethods: ['all'] }));
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                        comparison.rightPaymentMethods.includes('all')
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      All
                    </button>
                    {rightPaymentMethodOptions.filter(method => method !== 'all').map((method: string) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setComparison(prev => {
                            const newMethods = prev.rightPaymentMethods.includes('all')
                              ? [method]
                              : prev.rightPaymentMethods.includes(method)
                                ? prev.rightPaymentMethods.filter(m => m !== method)
                                : [...prev.rightPaymentMethods, method];
                            return { ...prev, rightPaymentMethods: newMethods.length ? newMethods : ['all'] };
                          });
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                          comparison.rightPaymentMethods.includes(method)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <OrderBook
                  fiat={fiat}
                  crypto={crypto}
                  buyOrders={rightFilteredOrders.buyOrders}
                  sellOrders={rightFilteredOrders.sellOrders}
                  loading={comparison.isLoading}
                  error={comparison.error}
                  exchange={comparison.rightExchange}
                  hasChanges={comparison.rightOrders.hasChanges}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 