import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Create an axios instance for OKX API
const okxApi = axios.create({
  baseURL: 'https://www.okx.com',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Origin': 'https://www.okx.com',
    'Pragma': 'no-cache',
    'Referer': 'https://www.okx.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

    console.log('Processing OKX P2P request:', { fiat, crypto, tradeType });

    // Map Binance trade type to OKX format if needed
    const okxTradeType = tradeType === 'BUY' ? 'buy' : 'sell';

    // This is a placeholder endpoint. The actual OKX API endpoint will need to be determined
    const response = await okxApi.post('/v3/c2c/advertisement/list', {
      quoteCurrency: fiat,
      baseCurrency: crypto,
      side: okxTradeType,
      paymentMethod: "ALL",
      userType: "all",
      sortType: "price_asc",
      pageSize: 20,
      pageNo: 1
    });

    // Log the complete raw response for debugging
    console.log('Raw OKX API Response:', {
      success: response.data.code === '0',
      data: response.data.data ? 'data exists' : 'no data',
      firstAdvertiser: response.data.data?.[0] ? 'first item exists' : 'no items'
    });

    if (!response.data || response.data.code !== '0') {
      console.error('Invalid OKX API response structure:', response.data);
      return NextResponse.json(
        { error: 'Invalid response from OKX API' },
        { status: 500 }
      );
    }

    // Transform OKX data to match our expected format
    // This will need to be adjusted based on actual OKX API response
    const transformedData = {
      success: response.data.code === '0',
      total: response.data.data?.length || 0,
      data: response.data.data || []
    };

    console.log('Successfully fetched OKX P2P data:', {
      ordersCount: transformedData.data.length,
      fiat,
      crypto,
      tradeType
    });

    // Add detailed logging of the raw API response
    if (transformedData.data[0]) {
      const firstOrder = transformedData.data[0];
      // Log complete raw data of first order
      console.log('Complete Raw OKX Order Data:', JSON.stringify(firstOrder, null, 2));
    }

    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('Error fetching OKX P2P data:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    let statusCode = error.response?.status || 500;
    let errorMessage = error.response?.data?.error || error.message || 'Failed to fetch data from OKX';

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 