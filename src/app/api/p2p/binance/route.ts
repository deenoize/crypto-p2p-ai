import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Create an axios instance for Binance API
const binanceApi = axios.create({
  baseURL: 'https://p2p.binance.com',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Origin': 'https://p2p.binance.com',
    'Pragma': 'no-cache',
    'Referer': 'https://p2p.binance.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'clienttype': 'web'
  }
});

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const fiat = url.searchParams.get('fiat');
    const crypto = url.searchParams.get('crypto');
    const tradeType = url.searchParams.get('tradeType');
    const debug = url.searchParams.get('debug') === 'true';

    if (!fiat || !crypto || !tradeType) {
      return NextResponse.json(
        { error: 'Missing required parameters: fiat, crypto, or tradeType' },
        { status: 400 }
      );
    }

    console.log('Processing Binance P2P request:', { fiat, crypto, tradeType, debug });

    const response = await binanceApi.post('/bapi/c2c/v2/friendly/c2c/adv/search', {
      fiat,
      asset: crypto,
      tradeType,
      page: 1,
      rows: 20,
      transAmount: "",
      countries: [],
      proMerchantAds: false,
      publisherType: null,
      payTypes: [],
      classifies: ["mass", "mass-v2"]
    });

    if (debug) {
      // Log the complete raw response for debugging
      console.log('Raw Binance API Response:', {
        success: response.data.success,
        total: response.data.total,
        firstAdvertiser: response.data.data?.[0]?.advertiser ? {
          ...response.data.data[0].advertiser,
          // Explicitly log all time-related fields
          onlineStatus: response.data.data[0].advertiser.onlineStatus,
          lastOnlineTime: response.data.data[0].advertiser.lastOnlineTime,
          lastActiveTime: response.data.data[0].advertiser.lastActiveTime,
          lastLoginTime: response.data.data[0].advertiser.lastLoginTime,
        } : null
      });
    }

    if (!response.data || !response.data.data) {
      console.error('Invalid Binance API response structure:', response.data);
      return NextResponse.json(
        { error: 'Invalid response from Binance API' },
        { status: 500 }
      );
    }

    console.log('Successfully fetched Binance P2P data:', {
      ordersCount: response.data.data.length,
      fiat,
      crypto,
      tradeType
    });

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Binance P2P API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch Binance P2P data';

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 