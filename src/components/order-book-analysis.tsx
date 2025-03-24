"use client";

import React from 'react';
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

const mockDepthData = {
  labels: ['44700', '44800', '44900', '45000', '45100', '45200'],
  datasets: [
    {
      label: 'Buy Orders',
      data: [500000, 400000, 300000, 200000, 100000, 0],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      fill: true
    },
    {
      label: 'Sell Orders',
      data: [0, 100000, 200000, 300000, 400000, 500000],
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
      text: 'Market Depth'
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

interface OrderBookStats {
  liquidityScore: number;
  marketDepth: number;
  volatility24h: number;
}

interface OrderBookData {
  price: number;
  amount: number;
  type: "BUY" | "SELL";
}

export function OrderBookAnalysis() {
  const [stats, setStats] = React.useState<OrderBookStats>({
    liquidityScore: 85,
    marketDepth: 500000,
    volatility24h: 1.2
  });

  const [orderBook, setOrderBook] = React.useState<OrderBookData[]>([
    // Sample data - replace with actual API data
    { price: 0.98, amount: 1000, type: "BUY" },
    { price: 0.99, amount: 1500, type: "BUY" },
    { price: 1.01, amount: 2000, type: "SELL" },
    { price: 1.02, amount: 1800, type: "SELL" },
  ]);

  const buyOrders = orderBook.filter(order => order.type === "BUY");
  const sellOrders = orderBook.filter(order => order.type === "SELL");

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
              High market liquidity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.15%</div>
            <p className="text-xs text-muted-foreground">
              Tight spread indicates high liquidity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Imbalance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Buy Dominated</div>
            <p className="text-xs text-muted-foreground">
              65% buy orders vs 35% sell orders
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
            <Line options={options} data={mockDepthData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 