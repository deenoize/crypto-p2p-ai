import { NextRequest, NextResponse } from 'next/server';
import { openAIService } from '@/services/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketData } = body;

    if (!marketData) {
      return NextResponse.json(
        { error: 'Missing required parameter: marketData' },
        { status: 400 }
      );
    }

    const strategies = await openAIService.generateTradingStrategies(marketData);

    return NextResponse.json(strategies);
  } catch (error: any) {
    console.error('Error in trading strategies API:', error);
    return NextResponse.json(
      { error: error.message || 'Error generating trading strategies' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // For GET requests, use mock data
    const mockMarketData = {
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

    const strategies = await openAIService.generateTradingStrategies(mockMarketData);

    return NextResponse.json(strategies);
  } catch (error: any) {
    console.error('Error in trading strategies API:', error);
    return NextResponse.json(
      { error: error.message || 'Error generating trading strategies' },
      { status: 500 }
    );
  }
} 