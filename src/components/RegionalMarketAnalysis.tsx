import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';
import { binanceP2PService, RegionVolume } from '@/services/binanceP2PService';
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

const CHART_COLORS = [
  'rgba(255, 99, 132, 0.5)',
  'rgba(54, 162, 235, 0.5)',
  'rgba(255, 206, 86, 0.5)',
  'rgba(75, 192, 192, 0.5)',
  'rgba(153, 102, 255, 0.5)',
  'rgba(255, 159, 64, 0.5)',
  'rgba(255, 99, 255, 0.5)',
  'rgba(54, 162, 255, 0.5)',
];

const CHART_BORDER_COLORS = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(255, 99, 255, 1)',
  'rgba(54, 162, 255, 1)',
];

interface RegionalMarketAnalysisProps {
  fiat: string;
  crypto: string;
}

export const RegionalMarketAnalysis: React.FC<RegionalMarketAnalysisProps> = ({ fiat, crypto }) => {
  const [regions, setRegions] = useState<RegionVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string | DateRange>('24h');

  const fetchRegions = async () => {
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

      const data = await binanceP2PService.getRegionVolumes(params);
      setRegions(data);
    } catch (err) {
      setError('Failed to fetch region volumes');
      console.error('Error fetching regions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
    const interval = setInterval(fetchRegions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange, fiat, crypto]);

  const chartData = {
    labels: regions.map((region) => region.region),
    datasets: [
      {
        data: regions.map((region) => region.volume.totalVolume),
        backgroundColor: CHART_COLORS,
        borderColor: CHART_BORDER_COLORS,
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

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Regional Market Distribution (${getTimeRangeLabel()})`,
      },
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regional Market Analysis</CardTitle>
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
          <CardTitle>Regional Market Analysis</CardTitle>
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
        <CardTitle>Regional Market Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <DateRangePicker
            timeRanges={TIME_RANGES}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
        <div className="h-[400px]">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
}; 