import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import { binanceP2PService } from '@/services/binanceP2PService';

interface MarketDepth {
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
}

export function MarketDepthAnalysis() {
  const [marketDepth, setMarketDepth] = useState<MarketDepth>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketDepth = async () => {
      try {
        const [bids, asks] = await Promise.all([
          binanceP2PService.getMarketDepth({
            asset: 'USDT',
            fiat: 'USD',
            tradeType: 'BUY',
          }),
          binanceP2PService.getMarketDepth({
            asset: 'USDT',
            fiat: 'USD',
            tradeType: 'SELL',
          }),
        ]);

        setMarketDepth({
          bids: bids.bids,
          asks: asks.asks,
        });
      } catch (err) {
        setError('Failed to fetch market depth');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketDepth();
  }, []);

  const chartData = {
    labels: [
      ...marketDepth.bids.map((bid) => bid.price.toFixed(2)),
      ...marketDepth.asks.map((ask) => ask.price.toFixed(2)),
    ],
    datasets: [
      {
        label: 'Bids',
        data: marketDepth.bids.map((bid) => bid.amount),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        fill: false,
      },
      {
        label: 'Asks',
        data: marketDepth.asks.map((ask) => ask.amount),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Market Depth Analysis',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Price',
        },
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Depth Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Depth Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Depth Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
} 