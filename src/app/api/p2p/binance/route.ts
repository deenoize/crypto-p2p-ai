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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fiat = searchParams.get('fiat');
    const crypto = searchParams.get('crypto');
    const tradeType = searchParams.get('tradeType');

    if (!fiat || !crypto || !tradeType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Origin': 'https://p2p.binance.com',
        'Pragma': 'no-cache',
        'Referer': 'https://p2p.binance.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'clienttype': 'web'
      },
      body: JSON.stringify({
        asset: crypto,
      fiat,
      page: 1,
      rows: 20,
        tradeType,
      transAmount: "",
        payTypes: [],
      countries: [],
      proMerchantAds: false,
      publisherType: null,
        classify: "mass"
      }),
    });

    if (!response.ok) {
      console.error('Binance API error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Binance API response:', {
      success: data.success,
      code: data.code,
      message: data.message,
      dataLength: data.data?.length,
      firstItem: data.data?.[0]
    });

    if (!data.success) {
      console.error('Binance API error response:', data);
      throw new Error(data.message || 'Failed to fetch data from Binance');
    }

    // Return the data in the expected structure
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Binance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Binance' },
      { status: 500 }
    );
  }
} 