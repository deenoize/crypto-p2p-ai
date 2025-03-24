"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { openAIService } from "@/services/ai";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SentimentData {
  trend: string;
  confidence: number;
  volumeTrend: string;
  priceMomentum: number;
  marketActivity: string;
  sentimentScore: number;
}

interface SentimentHistory {
  timestamp: string;
  sentimentScore: number;
  confidence: number;
}

export function SentimentAnalysis() {
  const [sentiment, setSentiment] = useState<SentimentData>({
    trend: "BULLISH",
    confidence: 75.5,
    volumeTrend: "INCREASING",
    priceMomentum: 2.8,
    marketActivity: "HIGH",
    sentimentScore: 65.2
  });

  const [history, setHistory] = useState<SentimentHistory[]>([
    // Sample data - replace with actual API data
    { timestamp: "2024-03-19T00:00:00", sentimentScore: 60, confidence: 70 },
    { timestamp: "2024-03-19T01:00:00", sentimentScore: 65, confidence: 75 },
    { timestamp: "2024-03-19T02:00:00", sentimentScore: 62, confidence: 72 },
  ]);
  
  const [loading, setLoading] = useState(false);

  // Function to fetch sentiment data
  const fetchSentimentData = async () => {
    setLoading(true);
    try {
      // Sample order book data - in a real app, this would come from your data store
      const sampleOrderBookData = {
        buyOrders: [
          { price: 1.05, amount: 500, paymentMethod: "Bank Transfer" },
          { price: 1.04, amount: 1000, paymentMethod: "Cash" },
          { price: 1.03, amount: 750, paymentMethod: "Revolut" }
        ],
        sellOrders: [
          { price: 1.06, amount: 800, paymentMethod: "Bank Transfer" },
          { price: 1.07, amount: 600, paymentMethod: "Cash" },
          { price: 1.08, amount: 350, paymentMethod: "Wise" }
        ],
        lastTrades: [
          { price: 1.055, amount: 200, side: "buy", timestamp: new Date().toISOString() },
          { price: 1.056, amount: 150, side: "sell", timestamp: new Date(Date.now() - 60000).toISOString() }
        ]
      };

      // Call the OpenAI service to analyze sentiment
      const newSentiment = await openAIService.analyzeSentiment(sampleOrderBookData);
      
      // Update the sentiment state
      setSentiment(newSentiment);
      
      // Add the new sentiment to history
      const newHistoryItem = {
        timestamp: new Date().toISOString(),
        sentimentScore: newSentiment.sentimentScore,
        confidence: newSentiment.confidence * 100 // Convert to percentage
      };
      
      setHistory(prevHistory => [...prevHistory, newHistoryItem]);
    } catch (error) {
      console.error("Error fetching sentiment data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sentiment data on component mount
  useEffect(() => {
    fetchSentimentData();
    
    // Optional: Set up a polling interval
    const interval = setInterval(fetchSentimentData, 60000); // Refresh every minute
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Market Sentiment</CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={fetchSentimentData}
            disabled={loading}
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>Refresh Analysis</>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Plot
            data={[
              {
                type: "indicator",
                mode: "gauge+number",
                value: sentiment.sentimentScore,
                title: { text: "Sentiment Score" },
                gauge: {
                  axis: { range: [-100, 100] },
                  bar: { color: "#2563eb" },
                  steps: [
                    { range: [-100, -50], color: "rgba(239, 68, 68, 0.7)" },
                    { range: [-50, 0], color: "rgba(245, 158, 11, 0.7)" },
                    { range: [0, 50], color: "rgba(34, 197, 94, 0.7)" },
                    { range: [50, 100], color: "rgba(16, 185, 129, 0.7)" }
                  ]
                }
              }
            ]}
            layout={{
              autosize: true,
              margin: { t: 60, r: 25, l: 25, b: 25 },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent"
            }}
            config={{ responsive: true }}
            style={{ width: "100%", height: "250px" }}
          />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Market Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sentiment.trend}
            </div>
            <div className="text-sm text-muted-foreground">
              Confidence: {(sentiment.confidence * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sentiment.volumeTrend}
            </div>
            <div className="text-sm text-muted-foreground">
              Momentum: {sentiment.priceMomentum.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Market Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sentiment.marketActivity}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sentiment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Plot
            data={[
              {
                x: history.map(d => d.timestamp),
                y: history.map(d => d.sentimentScore),
                type: "scatter",
                mode: "lines",
                name: "Sentiment Score",
                line: { color: "#2563eb" }
              },
              {
                x: history.map(d => d.timestamp),
                y: history.map(d => d.confidence),
                type: "scatter",
                mode: "lines",
                name: "Confidence",
                line: { color: "#10b981", dash: "dot" }
              }
            ]}
            layout={{
              autosize: true,
              margin: { t: 20, r: 50, l: 50, b: 30 },
              showlegend: true,
              xaxis: { type: "date" },
              yaxis: { title: "Score" },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent"
            }}
            config={{ responsive: true }}
            style={{ width: "100%", height: "300px" }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 