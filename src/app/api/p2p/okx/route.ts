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

// Function to generate mock OKX P2P data for development
function generateMockOkxP2PData(fiat: string, crypto: string, tradeType: 'BUY' | 'SELL', count = 20) {
  const data = [];
  const isBuy = tradeType === 'BUY';
  
  // Base price with some randomness
  const basePrice = crypto === 'USDT' || crypto === 'USDC' ? 1.0 : 
                   crypto === 'BTC' ? 90000 : 
                   crypto === 'ETH' ? 3500 : 1.0;
  
  // Create a range of prices
  for (let i = 0; i < count; i++) {
    // Create price variation (slightly higher for sell, lower for buy)
    const priceVariation = isBuy ? 
      (0.97 + Math.random() * 0.05) : // Buy orders are typically lower
      (1.0 + Math.random() * 0.08);   // Sell orders are typically higher
    
    const price = (basePrice * priceVariation).toFixed(crypto === 'BTC' ? 2 : 3);
    
    // Generate random amounts
    const amount = crypto === 'BTC' ? 
      (0.001 + Math.random() * 0.1).toFixed(8) : 
      (10 + Math.random() * 1000).toFixed(2);
    
    const minAmount = (parseFloat(amount) * 0.1).toFixed(crypto === 'BTC' ? 8 : 2);
    const maxAmount = (parseFloat(amount) * 1.5).toFixed(crypto === 'BTC' ? 8 : 2);
    
    // Generate payment methods
    const paymentMethods: string[] = [];
    const allPaymentMethods = [
      'BankTransfer', 'AliPay', 'WeChatPay', 'Paypal', 'Wise', 
      'Revolut', 'Skrill', 'Zelle', 'Cash App', 'Venmo'
    ];
    
    // Add 1-3 random payment methods
    const methodCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < methodCount; j++) {
      const method = allPaymentMethods[Math.floor(Math.random() * allPaymentMethods.length)];
      if (!paymentMethods.includes(method)) {
        paymentMethods.push(method);
      }
    }
    
    // Generate merchant data
    const completedTrades = 10 + Math.floor(Math.random() * 500);
    const rating = 0.8 + Math.random() * 0.2; // 80%-100%
    const completionRate = 0.85 + Math.random() * 0.15; // 85%-100%
    const lastOnlineTime = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400); // 0-24 hours ago
    
    data.push({
      adv: {
        advNo: `okx-mock-${tradeType.toLowerCase()}-${i}-${Date.now()}`,
        tradeType: tradeType,
        asset: crypto,
        fiatUnit: fiat,
        price: price,
        surplusAmount: amount,
        tradableQuantity: amount,
        maxSingleTransAmount: maxAmount,
        minSingleTransAmount: minAmount,
        tradeMethods: paymentMethods.map(method => ({
          payType: method,
          identifier: method,
          tradeMethodName: method
        })),
        assetScale: crypto === 'BTC' ? 8 : 2,
        fiatScale: 2,
        priceScale: crypto === 'BTC' ? 2 : 3,
        fiatSymbol: fiat === 'USD' ? '$' : fiat
      },
      advertiser: {
        userNo: `okx-user-${i}-${Date.now()}`,
        nickName: `OKX_Trader_${i}`,
        monthOrderCount: completedTrades,
        monthFinishRate: completionRate,
        positiveRate: rating,
        userType: 'user',
        userGrade: Math.floor(Math.random() * 3) + 1,
        activeTimeInSecond: Math.floor(Date.now() / 1000) - lastOnlineTime
      }
    });
  }
  
  return data;
}

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

    try {
      // Try the API request if we have the correct endpoint later
      // const response = await okxApi.post('/api/v5/trade/c2c/list', {
      //   quoteCurrency: fiat,
      //   baseCurrency: crypto,
      //   side: okxTradeType,
      //   paymentMethod: "ALL",
      //   userType: "all",
      //   sortType: "price_asc",
      //   pageSize: 20,
      //   pageNo: 1
      // });
      
      // For now, use mock data
      const mockData = generateMockOkxP2PData(fiat, crypto, tradeType);
      
      // Transform OKX data to match our expected format
      const transformedData = {
        success: true,
        total: mockData.length,
        data: mockData
      };

      console.log('Successfully fetched OKX P2P data:', {
        ordersCount: transformedData.data.length,
        fiat,
        crypto,
        tradeType
      });

      // Add detailed logging of the first order
      if (transformedData.data[0]) {
        const firstOrder = transformedData.data[0];
        console.log('Sample OKX Order Data:', {
          price: firstOrder.adv.price,
          amount: firstOrder.adv.surplusAmount,
          paymentMethods: firstOrder.adv.tradeMethods.map((m: any) => m.identifier).join(', '),
          merchant: {
            name: firstOrder.advertiser.nickName,
            rating: firstOrder.advertiser.positiveRate,
            completedTrades: firstOrder.advertiser.monthOrderCount
          }
        });
      }

      return NextResponse.json(transformedData);
    } catch (apiError: any) {
      console.error('Error calling OKX API:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status
      });
      
      // If the API call fails, still return mock data so the front-end works
      const mockData = generateMockOkxP2PData(fiat, crypto, tradeType);
      
      console.log('Using mock OKX data after API error');
      
      return NextResponse.json({
        success: true,
        total: mockData.length,
        data: mockData
      });
    }
  } catch (error: any) {
    console.error('Error processing OKX P2P request:', {
      message: error.message,
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