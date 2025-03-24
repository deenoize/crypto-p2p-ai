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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fiat, crypto, tradeType } = body;

    if (!fiat || !crypto || !tradeType) {
      return NextResponse.json(
        { error: 'Missing required parameters: fiat, crypto, or tradeType' },
        { status: 400 }
      );
    }

    console.log('Processing P2P request:', { fiat, crypto, tradeType });

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

    if (!response.data || !response.data.data) {
      console.error('Invalid Binance API response structure:', response.data);
      return NextResponse.json(
        { error: 'Invalid response from Binance API' },
        { status: 500 }
      );
    }

    console.log('Successfully fetched P2P data:', {
      ordersCount: response.data.data.length,
      fiat,
      crypto,
      tradeType
    });

    // Add detailed logging of the raw API response
    if (response.data.data[0]) {
      const firstOrder = response.data.data[0];
      // Log complete raw data of first order
      console.log('Complete Raw Order Data:', JSON.stringify(firstOrder, null, 2));
      
      // Log specific fields we're interested in
      console.log('Merchant Time Data:', {
        nickName: firstOrder.advertiser.nickName,
        onlineStatus: firstOrder.advertiser.onlineStatus,
        lastOnlineTime: firstOrder.advertiser.lastOnlineTime,
        userNo: firstOrder.advertiser.userNo,
        onlineTimeType: typeof firstOrder.advertiser.lastOnlineTime
      });
    }

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('P2P API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch P2P data';

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 