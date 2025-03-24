"use client";

import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { openAIService } from "@/services/ai";
import { ReloadIcon } from "@radix-ui/react-icons";

interface Strategy {
  id: number;
  name: string;
  description: string;
  riskLevel: string;
  potentialRoi: string;
  timeFrame: string;
  requirements?: string[];
  currentSignal?: string;
  confidence?: number;
}

export function TradingStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  // Fetch strategies from the OpenAI service
  const fetchStrategies = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sample market data - in a real app, this would come from your data store
      const marketData = {
        priceData: {
          currentPrice: 1.056,
          priceChange24h: 0.012,
          priceChange7d: -0.025,
          volume24h: 567890,
          marketCap: 12345678,
        },
        orderBookData: {
          buyOrdersCount: 245,
          sellOrdersCount: 198,
          buyVolume: 12500,
          sellVolume: 9800,
          averageBuyPrice: 1.045,
          averageSellPrice: 1.067
        },
        trendData: {
          direction: "sideways",
          strength: "medium",
          volatility: "low"
        }
      };

      // Get strategies from the OpenAI service
      const strategiesData = await openAIService.generateTradingStrategies(marketData);
      setStrategies(strategiesData);
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError("Failed to fetch trading strategies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  // Filter strategies based on selected risk level
  const filteredStrategies = selectedRisk === "all"
    ? strategies
    : strategies.filter(s => s.riskLevel.toLowerCase() === selectedRisk.toLowerCase());

  // Sort strategies based on selected sorting option
  const sortedStrategies = sortBy === "roi"
    ? [...filteredStrategies].sort((a, b) => {
        // Extract numbers from ROI strings like "3-5%" or "8-15%"
        const aMatch = a.potentialRoi.match(/(\d+)(?:-(\d+))?%/);
        const bMatch = b.potentialRoi.match(/(\d+)(?:-(\d+))?%/);
        
        if (!aMatch || !bMatch) return 0;
        
        // Get the higher value from the range (or single value)
        const aVal = parseInt(aMatch[2] || aMatch[1]);
        const bVal = parseInt(bMatch[2] || bMatch[1]);
        
        return bVal - aVal; // Sort by highest ROI first
      })
    : filteredStrategies;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Trading Strategies</CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchStrategies}
            disabled={loading}
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : "Refresh"}
          </Button>
          <Select 
            defaultValue="all" 
            value={selectedRisk}
            onValueChange={setSelectedRisk}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            defaultValue="default" 
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="roi">Potential ROI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <ReloadIcon className="h-6 w-6 animate-spin mr-2" />
            <span>Loading strategies...</span>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : sortedStrategies.length === 0 ? (
          <div className="text-center py-6">No strategies available for the selected filters</div>
        ) : (
          <div className="space-y-4">
            {sortedStrategies.map((strategy) => (
              <div 
                key={strategy.id} 
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{strategy.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    strategy.riskLevel === "low" ? "bg-green-100 text-green-800" :
                    strategy.riskLevel === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)} Risk
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Potential ROI:</span>{" "}
                    <span className="font-medium">{strategy.potentialRoi}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time Frame:</span>{" "}
                    <span className="font-medium">{strategy.timeFrame}</span>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-3">View Details</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{strategy.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p>{strategy.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Risk Level:</span>
                          <p>{strategy.riskLevel}</p>
                        </div>
                        <div>
                          <span className="font-medium">Potential ROI:</span>
                          <p>{strategy.potentialRoi}</p>
                        </div>
                        <div>
                          <span className="font-medium">Time Frame:</span>
                          <p>{strategy.timeFrame}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 