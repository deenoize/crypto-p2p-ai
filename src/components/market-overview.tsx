"use client";

import React, { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { binanceP2PService } from "@/services/binanceP2PService";
import { okxP2PService } from "@/services/okxP2PService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MarketOverviewProps {
  exchange: string;
  fiat: string;
  crypto: string;
}

export const MarketOverview: FC<MarketOverviewProps> = ({ exchange, fiat, crypto }) => {
  const [marketData, setMarketData] = useState({
    currentPrice: 0,
    priceChange: 0,
    volume24h: 0,
    volumeChange: 0,
    activeOrders: 0,
    ordersChange: 0,
    priceHistory: {
      labels: [] as string[],
      data: [] as number[]
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Select the appropriate service based on exchange
        const p2pService = exchange === 'okx' ? okxP2PService : binanceP2PService;
        
        // Fetch orders to calculate metrics
        const data = await p2pService.getOrders(fiat, crypto);
        
        // Calculate average price from orders
        const buyPrices = data.buyOrders.map(order => parseFloat(String(order.price)));
        const sellPrices = data.sellOrders.map(order => parseFloat(String(order.price)));
        const allPrices = [...buyPrices, ...sellPrices];
        
        const currentPrice = allPrices.length 
          ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length 
          : 0;
        
        // Generate sample price history based on current price
        // In a real implementation, you would fetch this from an API
        const now = new Date();
        const labels = [];
        const priceData = [];
        
        for (let i = 0; i < 6; i++) {
          const time = new Date(now);
          time.setHours(now.getHours() - (5 - i) * 4);
          labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          
          // Generate slightly varied price based on current price
          const variance = (Math.random() - 0.5) * 0.05;
          priceData.push(currentPrice * (1 + variance));
        }
        
        setMarketData({
          currentPrice,
          priceChange: Math.random() * 4 - 2, // Random change between -2% and +2%
          volume24h: data.buyOrders.length + data.sellOrders.length,
          volumeChange: Math.random() * 30 - 10, // Random change between -10% and +20%
          activeOrders: data.buyOrders.length + data.sellOrders.length,
          ordersChange: Math.floor(Math.random() * 10), // Random change between 0 and 10
          priceHistory: {
            labels,
            data: priceData
          }
        });
      } catch (err: any) {
        console.error(`Error fetching market data:`, err);
        setError(err.message || 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [exchange, fiat, crypto]);

  const chartData = {
    labels: marketData.priceHistory.labels,
    datasets: [
      {
        label: `${crypto}/${fiat} Price`,
        data: marketData.priceHistory.data,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${crypto}/${fiat} 24h Price Movement (${exchange.toUpperCase()})`
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  if (loading && marketData.currentPrice === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview - {exchange.toUpperCase()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h3>Price Trends</h3>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Current Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${marketData.currentPrice.toFixed(2)}</div>
                  <p className={`text-xs ${marketData.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {marketData.priceChange >= 0 ? '+' : ''}{marketData.priceChange.toFixed(2)}% from yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>24h Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marketData.volume24h}</div>
                  <p className={`text-xs ${marketData.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {marketData.volumeChange >= 0 ? '+' : ''}{marketData.volumeChange.toFixed(2)}% from yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{marketData.activeOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    +{marketData.ordersChange} in last hour
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line options={options} data={chartData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div>
          <h3>Volume Analysis</h3>
          {/* Volume analysis content */}
        </div>
      </CardContent>
    </Card>
  );
}; 