import { NextRequest, NextResponse } from 'next/server';
import { RestClient } from 'okx-api';
import axios from 'axios';
import crypto from 'crypto';

// Direct test endpoint to check OKX API connectivity
export async function GET(request: NextRequest) {
  try {
    // Display API credentials (masked)
    const OKX_API_KEY = process.env.OKX_API_KEY || '';
    const OKX_API_SECRET = process.env.OKX_API_SECRET || '';
    const OKX_API_PASSPHRASE = process.env.OKX_API_PASSPHRASE || '';

    const maskedKey = OKX_API_KEY ? `${OKX_API_KEY.substring(0, 4)}...${OKX_API_KEY.substring(OKX_API_KEY.length - 4)}` : 'Missing';
    const maskedSecret = OKX_API_SECRET ? `${OKX_API_SECRET.substring(0, 4)}...${OKX_API_SECRET.substring(OKX_API_SECRET.length - 4)}` : 'Missing';
    const maskedPassphrase = OKX_API_PASSPHRASE ? `${OKX_API_PASSPHRASE.substring(0, 2)}...${OKX_API_PASSPHRASE.substring(OKX_API_PASSPHRASE.length - 2)}` : 'Missing';

    // Initialize OKX REST client
    const client = new RestClient({
      apiKey: OKX_API_KEY,
      apiSecret: OKX_API_SECRET,
      apiPass: OKX_API_PASSPHRASE,
    });

    // Test 1: Get index tickers (public endpoint)
    let indexTickersResult;
    try {
      const indexTickers = await client.getIndexTickers({ instId: 'BTC-USDT' });
      indexTickersResult = { success: true, data: indexTickers };
    } catch (error: any) {
      indexTickersResult = { 
        success: false, 
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      };
    }

    // Test 2: Try public P2P endpoint
    let publicEndpointResult;
    try {
      const response = await axios.get('https://www.okx.com/api/v5/c2c/advertisement/list', {
        params: {
          quoteCurrency: 'USD',
          baseCurrency: 'USDT',
          side: 'sell', // For BUY trade type
          paymentMethod: 'ALL',
          limit: '20',
          offset: '0'
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.okx.com',
          'Referer': 'https://www.okx.com/p2p-markets',
        }
      });
      
      publicEndpointResult = { 
        success: true, 
        status: response.status,
        statusText: response.statusText,
        data: response.data 
      };
    } catch (error: any) {
      publicEndpointResult = { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack?.split('\n').slice(0, 3)
      };
    }

    // Test 3: Try authenticated P2P endpoint
    let authenticatedEndpointResult;
    try {
      const timestamp = new Date().toISOString();
      const path = '/api/v5/c2c/advertisement/list';
      
      // Build query string
      const params = {
        quoteCurrency: 'USD',
        baseCurrency: 'USDT',
        side: 'sell', // For BUY trade type
        paymentMethod: 'ALL',
        limit: '20',
        offset: '0'
      };
      
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      const queryString = searchParams.toString();
      const fullPath = queryString ? `${path}?${queryString}` : path;
      
      // Build signature
      const prehashString = timestamp + 'GET' + fullPath + '';
      const signature = crypto.createHmac('sha256', OKX_API_SECRET)
        .update(prehashString)
        .digest('base64');
      
      // Create request with proper OKX authentication
      const response = await axios({
        method: 'GET',
        url: `https://www.okx.com${fullPath}`,
        headers: {
          'Content-Type': 'application/json',
          'OK-ACCESS-KEY': OKX_API_KEY,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': OKX_API_PASSPHRASE
        }
      });
      
      authenticatedEndpointResult = { 
        success: true, 
        status: response.status,
        statusText: response.statusText,
        data: response.data 
      };
    } catch (error: any) {
      authenticatedEndpointResult = { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack?.split('\n').slice(0, 3)
      };
    }

    // Return combined test results
    return NextResponse.json({
      apiCredentials: {
        key: maskedKey,
        secret: maskedSecret,
        passphrase: maskedPassphrase
      },
      tests: {
        indexTickers: indexTickersResult,
        publicEndpoint: publicEndpointResult,
        authenticatedEndpoint: authenticatedEndpointResult
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        stack: error.stack?.split('\n').slice(0, 3)
      },
      { status: 500 }
    );
  }
} 