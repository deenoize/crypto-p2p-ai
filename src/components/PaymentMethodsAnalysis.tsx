import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import { binanceP2PService, PaymentMethodVolume } from '@/services/binanceP2PService';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { ChartOptions } from 'chart.js';

const TIME_RANGES = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

interface PaymentMethodsAnalysisProps {
  fiat: string;
  crypto: string;
}

export const PaymentMethodsAnalysis: React.FC<PaymentMethodsAnalysisProps> = ({ fiat, crypto }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string | DateRange>('24h');

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      let params;
      if (typeof timeRange === 'string') {
        const now = new Date();
        let startTime = new Date();
        switch (timeRange) {
          case '24h':
            startTime.setHours(now.getHours() - 24);
            break;
          case '7d':
            startTime.setDate(now.getDate() - 7);
            break;
          case '30d':
            startTime.setDate(now.getDate() - 30);
            break;
          default:
            startTime.setHours(now.getHours() - 24);
        }
        params = {
          asset: crypto,
          fiat: fiat,
          timeRange: {
            startTime: startTime.getTime(),
            endTime: now.getTime(),
          },
        };
      } else {
        params = {
          asset: crypto,
          fiat: fiat,
          timeRange: {
            startTime: timeRange.from?.getTime() || Date.now() - 24 * 60 * 60 * 1000,
            endTime: timeRange.to?.getTime() || Date.now(),
          },
        };
      }

      const data = await binanceP2PService.getPaymentMethodVolumes(params);
      setPaymentMethods(data);
    } catch (err) {
      setError('Failed to fetch payment method volumes');
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
    const interval = setInterval(fetchPaymentMethods, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange, fiat, crypto]);

  const chartData = {
    labels: paymentMethods.map((method) => method.method),
    datasets: [
      {
        label: `Total Volume (${crypto})`,
        data: paymentMethods.map((method) => method.volume.totalVolume),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Order Count',
        data: paymentMethods.map((method) => method.volume.orderCount),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const getTimeRangeLabel = () => {
    if (typeof timeRange === 'string') {
      return timeRange;
    }
    return `${format(timeRange.from || new Date(), 'MMM d, yyyy')} - ${format(timeRange.to || new Date(), 'MMM d, yyyy')}`;
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Payment Method Volumes (${getTimeRangeLabel()})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear',
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Analysis</CardTitle>
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
        <CardTitle>Payment Methods Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <DateRangePicker
            timeRanges={TIME_RANGES}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
        <Bar data={chartData} options={chartOptions} />
      </CardContent>
    </Card>
  );
};