"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { useState } from "react";

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Market Sentiment</CardTitle>
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
              Confidence: {sentiment.confidence.toFixed(1)}%
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