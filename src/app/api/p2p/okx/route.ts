import { NextRequest, NextResponse } from 'next/server';
import { formatOKXOrders } from './formatter';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * GET route handler for OKX P2P API
 * Uses the public P2P endpoint to fetch real-time market data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const crypto = searchParams.get('crypto') || 'USDT';
  const fiat = searchParams.get('fiat') || 'USD';
  const tradeType = searchParams.get('tradeType') || 'BUY';
  const debug = searchParams.get('debug') === 'true';

  // Log request information
  console.log('---------------------------------------------------');
  console.log(`🔄 OKX P2P API Request: { fiat: '${fiat}', crypto: '${crypto}', tradeType: '${tradeType}', debug: ${debug} }`);
  console.log('---------------------------------------------------');
  
  // Debug logging
  if (debug) {
    const logPath = path.join(process.cwd(), 'okx-api-debug.log');
    try {
      // Clear log file if it exists
      fs.writeFileSync(logPath, '');
      console.log(`Cleared debug log file at ${logPath}`);
    } catch (err) {
      console.error('Error writing to debug log:', err);
    }
  }
  
  console.log(`INFO: Processing P2P request: { fiat: '${fiat}', crypto: '${crypto}', tradeType: '${tradeType}' }`);

  try {
    // Use the correct P2P API endpoint
    const response = await axios.get('https://www.okx.com/v3/c2c/tradingOrders/books', {
      params: {
        quoteCurrency: fiat,
        baseCurrency: crypto,
        side: tradeType.toLowerCase(),
        paymentMethod: 'all',
        userType: 'all',
        showTrade: false,
        showFollow: false,
        showAlreadyTraded: false,
        isAbleFilter: false
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.okx.com',
        'Referer': 'https://www.okx.com/p2p/ads',
        'x-cdn': '1',
        'x-locale': 'en_US'
      }
    });

    if (response.status === 200 && response.data) {
      // Format the response using our formatter
      const formattedData = formatOKXOrders(response.data, fiat, crypto, tradeType);
      return NextResponse.json(formattedData);
    }

    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  } catch (error: any) {
    console.error('Error fetching OKX P2P data:', error);
    
    // Log detailed error information
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: error.config?.headers
      }
    };
    
    console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));
    
    // Return error response
    return NextResponse.json({
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    }, { status: error.response?.status || 500 });
  }
} 