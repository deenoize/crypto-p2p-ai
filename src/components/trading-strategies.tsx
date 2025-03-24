"use client";

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Strategy {
  id: string;
  name: string;
  description: string;
  risk: string;
  potentialReturn: string;
  timeFrame: string;
  requirements: string[];
  currentSignal: string;
  confidence: number;
}

interface TradingStrategiesProps {
  strategies: Strategy[];
  loading?: boolean;
  error?: string;
  selectedRisk?: string;
  sortBy?: string;
}

export const TradingStrategies: FC<TradingStrategiesProps> = ({
  strategies = [],
  loading = false,
  error,
  selectedRisk,
  sortBy
}) => {
  if (loading) {
    return <div role="status" className="animate-spin">Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (strategies.length === 0) {
    return <div>No strategies available</div>;
  }

  const filteredStrategies = selectedRisk
    ? strategies.filter(s => s.risk.toLowerCase() === selectedRisk.toLowerCase())
    : strategies;

  const sortedStrategies = sortBy === 'confidence'
    ? [...filteredStrategies].sort((a, b) => b.confidence - a.confidence)
    : filteredStrategies;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedStrategies.map(strategy => (
          <div key={strategy.id}>
            <h3>{strategy.name}</h3>
            <div className={`text-${strategy.currentSignal === 'BUY' ? 'green' : 'yellow'}-600`}>
              {strategy.currentSignal}
            </div>
            <div>{strategy.confidence}%</div>
            <div>{strategy.requirements.join(', ')}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}; 