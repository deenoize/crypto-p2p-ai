import { NextRequest, NextResponse } from 'next/server';
import { openAIService } from '@/services/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderBookData } = body;

    if (!orderBookData) {
      return NextResponse.json(
        { error: 'Missing required parameter: orderBookData' },
        { status: 400 }
      );
    }

    const sentiment = await openAIService.analyzeSentiment(orderBookData);

    return NextResponse.json(sentiment);
  } catch (error: any) {
    console.error('Error in sentiment analysis API:', error);
    return NextResponse.json(
      { error: error.message || 'Error analyzing sentiment' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // For GET requests, use mock data since we don't have order book data
    const mockOrderBookData = {
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

    const sentiment = await openAIService.analyzeSentiment(mockOrderBookData);

    return NextResponse.json(sentiment);
  } catch (error: any) {
    console.error('Error in sentiment analysis API:', error);
    return NextResponse.json(
      { error: error.message || 'Error analyzing sentiment' },
      { status: 500 }
    );
  }
} 