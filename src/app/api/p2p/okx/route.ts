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

    const response = await fetch(`https://www.okx.com/v3/c2c/tradingOrders/books?quoteCurrency=${fiat}&baseCurrency=${crypto}&side=${tradeType.toLowerCase()}&paymentMethod=all&userType=all&showTrade=false&showFollow=false&showAlreadyTraded=false&isAbleFilter=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`OKX API error: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Format the response data
    const formattedData = formatOKXOrders(rawData, fiat, crypto, tradeType);
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching from OKX:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from OKX' },
      { status: 500 }
    );
  }
} 