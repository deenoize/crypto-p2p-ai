"use client";

import React, { useEffect } from 'react';
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
  Legend,
  Filler
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
  Legend,
  Filler
);

interface OrderBookStats {
  liquidityScore: number;
  marketDepth: number;
  volatility24h: number;
  spread: number;
  buyPercentage: number;
  sellPercentage: number;
}

interface OrderBookData {
  price: number;
  amount: number;
  type: "BUY" | "SELL";
}

interface OrderBookAnalysisProps {
  exchange: string;
  fiat: string;
  crypto: string;
}

export function OrderBookAnalysis({ exchange, fiat, crypto }: OrderBookAnalysisProps) {
  const [stats, setStats] = React.useState<OrderBookStats>({
    liquidityScore: 85,
    marketDepth: 500000,
    volatility24h: 1.2,
    spread: 0.15,
    buyPercentage: 65,
    sellPercentage: 35
  });

  const [orderBook, setOrderBook] = React.useState<OrderBookData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [depthChartData, setDepthChartData] = React.useState({
    labels: [] as string[],
    buyData: [] as number[],
    sellData: [] as number[]
  });

  useEffect(() => {
    const fetchOrderBookData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Select the appropriate service based on exchange
        const p2pService = exchange === 'okx' ? okxP2PService : binanceP2PService;
        
        // Fetch orders
        const data = await p2pService.getOrders(fiat, crypto);
        
        // Process buy orders
        const buyOrders = data.buyOrders.map(order => ({
          price: parseFloat(String(order.price)),
          amount: parseFloat(String(order.amount)),
          type: "BUY" as const
        })).sort((a, b) => b.price - a.price); // Sort buy orders by price (highest first)
        
        // Process sell orders
        const sellOrders = data.sellOrders.map(order => ({
          price: parseFloat(String(order.price)),
          amount: parseFloat(String(order.amount)),
          type: "SELL" as const
        })).sort((a, b) => a.price - b.price); // Sort sell orders by price (lowest first)
        
        // Combine and update order book
        setOrderBook([...buyOrders, ...sellOrders]);
        
        // Calculate market stats
        if (buyOrders.length && sellOrders.length) {
          const highestBuy = buyOrders[0].price;
          const lowestSell = sellOrders[0].price;
          const spread = ((lowestSell - highestBuy) / highestBuy) * 100;
          
          const totalBuyVolume = buyOrders.reduce((sum, order) => sum + order.amount, 0);
          const totalSellVolume = sellOrders.reduce((sum, order) => sum + order.amount, 0);
          const totalVolume = totalBuyVolume + totalSellVolume;
          
          const buyPercentage = Math.round((totalBuyVolume / totalVolume) * 100);
          const sellPercentage = 100 - buyPercentage;
          
          // Simple liquidity score based on volume and spread
          const liquidityScore = Math.min(100, Math.round(
            (totalVolume / 10000) * 50 + 
            (1 / Math.max(0.1, spread)) * 50
          ));
          
          setStats({
            liquidityScore,
            marketDepth: Math.round(totalVolume),
            volatility24h: 1.2, // Placeholder - would need historical data
            spread,
            buyPercentage,
            sellPercentage
          });
          
          // Create depth chart data
          // Group prices into buckets for the chart
          const allPrices = [...buyOrders.map(o => o.price), ...sellOrders.map(o => o.price)];
          const minPrice = Math.min(...allPrices);
          const maxPrice = Math.max(...allPrices);
          const range = maxPrice - minPrice;
          const bucketSize = range / 10;
          
          const priceBuckets = [];
          for (let i = 0; i < 12; i++) {
            priceBuckets.push((minPrice + bucketSize * i).toFixed(2));
          }
          
          // Calculate cumulative volumes
          const buyData = new Array(priceBuckets.length).fill(0);
          const sellData = new Array(priceBuckets.length).fill(0);
          
          buyOrders.forEach(order => {
            const bucketIndex = Math.floor((order.price - minPrice) / bucketSize);
            if (bucketIndex >= 0 && bucketIndex < buyData.length) {
              buyData[bucketIndex] += order.amount;
            }
          });
          
          sellOrders.forEach(order => {
            const bucketIndex = Math.floor((order.price - minPrice) / bucketSize);
            if (bucketIndex >= 0 && bucketIndex < sellData.length) {
              sellData[bucketIndex] += order.amount;
            }
          });
          
          // Calculate cumulative sums
          for (let i = 1; i < buyData.length; i++) {
            buyData[i] += buyData[i - 1];
          }
          
          for (let i = sellData.length - 2; i >= 0; i--) {
            sellData[i] += sellData[i + 1];
          }
          
          setDepthChartData({
            labels: priceBuckets,
            buyData,
            sellData
          });
        }
      } catch (err: any) {
        console.error(`Error fetching order book data:`, err);
        setError(err.message || 'Failed to load order book data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderBookData();
    const interval = setInterval(fetchOrderBookData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [exchange, fiat, crypto]);

  const chartData = {
    labels: depthChartData.labels,
    datasets: [
      {
        label: 'Buy Orders',
        data: depthChartData.buyData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true
      },
      {
        label: 'Sell Orders',
        data: depthChartData.sellData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true
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
        text: `${crypto}/${fiat} Market Depth (${exchange.toUpperCase()})`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Volume'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Price'
        }
      }
    }
  };

  if (loading && orderBook.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Book Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buyDominated = stats.buyPercentage > stats.sellPercentage;
  const dominanceStyle = buyDominated ? "text-green-600" : "text-red-600";
  const dominanceText = buyDominated ? "Buy Dominated" : "Sell Dominated";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.liquidityScore.toFixed(1)}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.liquidityScore > 80 ? 'High' : stats.liquidityScore > 50 ? 'Medium' : 'Low'} market liquidity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.spread.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.spread < 0.5 ? 'Tight' : stats.spread < 2 ? 'Medium' : 'Wide'} spread
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Imbalance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dominanceStyle}`}>{dominanceText}</div>
            <p className="text-xs text-muted-foreground">
              {stats.buyPercentage}% buy vs {stats.sellPercentage}% sell orders
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Market Depth Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line options={options} data={chartData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 