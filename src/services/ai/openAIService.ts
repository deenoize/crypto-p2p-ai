import OpenAI from 'openai';
import { OPENAI_API_KEY, isServer } from '@/lib/env';

/**
 * OpenAI Service for generating market sentiment analysis and trading insights
 */
export class OpenAIService {
  private client: OpenAI | null = null;
  
  constructor() {
    // Only initialize the client if we have an API key and we're on the server
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here' && isServer) {
      this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
    } else {
      console.warn('OpenAI client not initialized: API key missing or running on client side');
    }
  }

  /**
   * Analyze market sentiment based on order book data
   * @param orderBookData The order book data to analyze
   * @returns Sentiment analysis results
   */
  async analyzeSentiment(orderBookData: any): Promise<{
    trend: string;
    confidence: number;
    volumeTrend: string;
    priceMomentum: number;
    marketActivity: string;
    sentimentScore: number;
  }> {
    try {
      if (!this.client) {
        console.error('OpenAI API key is not configured');
        return this.getMockSentimentData();
      }

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst specialized in P2P market sentiment analysis. Analyze the provided order book data and return sentiment metrics.'
          },
          {
            role: 'user',
            content: `Analyze this P2P order book data and provide market sentiment metrics: ${JSON.stringify(orderBookData)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      // Parse the response and extract sentiment metrics
      const analysisText = response.choices[0].message.content || '';
      return this.parseSentimentResponse(analysisText);
    } catch (error) {
      console.error('Error analyzing sentiment with OpenAI:', error);
      return this.getMockSentimentData();
    }
  }

  /**
   * Generate trading strategy recommendations based on market data
   * @param marketData Market data for strategy generation
   * @returns Trading strategy recommendations
   */
  async generateTradingStrategies(marketData: any): Promise<any[]> {
    try {
      if (!this.client) {
        console.error('OpenAI API key is not configured');
        return this.getMockStrategiesData();
      }

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency trading expert. Generate trading strategies based on the provided market data.'
          },
          {
            role: 'user',
            content: `Generate 3-5 trading strategies based on this market data: ${JSON.stringify(marketData)}`
          }
        ],
        temperature: 0.4,
        max_tokens: 800,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      // Parse the response and extract strategy recommendations
      const strategiesText = response.choices[0].message.content || '';
      return this.parseStrategiesResponse(strategiesText);
    } catch (error) {
      console.error('Error generating trading strategies with OpenAI:', error);
      return this.getMockStrategiesData();
    }
  }

  /**
   * Parse sentiment analysis response from OpenAI
   * @param text Response text from OpenAI
   * @returns Structured sentiment data
   */
  private parseSentimentResponse(text: string): any {
    // In a real implementation, this would parse the AI response
    // For simplicity, we return mock data
    return this.getMockSentimentData();
  }

  /**
   * Parse strategy recommendations from OpenAI
   * @param text Response text from OpenAI
   * @returns Structured strategy data
   */
  private parseStrategiesResponse(text: string): any[] {
    // In a real implementation, this would parse the AI response
    // For simplicity, we return mock data
    return this.getMockStrategiesData();
  }

  /**
   * Return mock sentiment data for development or when API key is missing
   */
  private getMockSentimentData() {
    return {
      trend: 'bullish',
      confidence: 0.78,
      volumeTrend: 'increasing',
      priceMomentum: 0.65,
      marketActivity: 'high',
      sentimentScore: 7.2
    };
  }

  /**
   * Return mock strategy data for development or when API key is missing
   */
  private getMockStrategiesData() {
    return [
      {
        id: 1,
        name: 'Arbitrage Opportunity',
        description: 'Buy USDT from lower priced sellers and sell to higher priced buyers',
        riskLevel: 'low',
        potentialRoi: '3-5%',
        timeFrame: 'short-term'
      },
      {
        id: 2,
        name: 'Volume Accumulation',
        description: 'Gradually accumulate BTC while market sentiment is bullish',
        riskLevel: 'medium',
        potentialRoi: '8-15%',
        timeFrame: 'medium-term'
      },
      {
        id: 3,
        name: 'Payment Method Spread',
        description: 'Target specific payment methods with wider spreads for better margins',
        riskLevel: 'low',
        potentialRoi: '2-4%',
        timeFrame: 'short-term'
      },
      {
        id: 4,
        name: 'Merchant Trust Building',
        description: 'Build trust score through small transactions to access better rates',
        riskLevel: 'low',
        potentialRoi: '1-8%',
        timeFrame: 'long-term'
      }
    ];
  }
} 