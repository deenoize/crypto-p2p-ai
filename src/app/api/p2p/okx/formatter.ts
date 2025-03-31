/**
 * Formatter for OKX P2P API response
 * This module transforms the OKX P2P API response data into our standardized format
 * for consistency with our Binance implementation
 */

export interface OKXAdvertiser {
  uid: string;         // User ID
  nickName: string;    // Nickname
  userType: string;    // User type (normal, merchant, etc.)
  monthOrderCount?: number; // Orders in past month (if available)
  monthFinishRate?: number; // Order completion rate (if available)
  positiveRate?: number;    // Positive feedback rate (if available)
  userGrade?: number;       // User level/grade
  isOnline?: boolean;       // Whether user is online
  lastActiveTime?: number;  // Last active timestamp
}

export interface OKXOffer {
  id: string;               // Offer ID
  tradeType: string;        // buy or sell
  cryptoCurrency: string;   // e.g., BTC, USDT
  fiatCurrency: string;     // e.g., USD, EUR
  price: string;            // Price per crypto unit
  maxAmount: string;        // Max transaction amount
  minAmount: string;        // Min transaction amount
  availableAmount: string;  // Available amount
  paymentMethods: string[]; // Accepted payment methods
  advertiser: OKXAdvertiser;// Advertiser info
}

// Format a single OKX P2P offer to our common structure
function formatOKXOffer(offer: any, fiat: string, crypto: string, tradeType: string): any {
  // console.log("Formatting OKX offer:", JSON.stringify(offer).substring(0, 200) + '...');
  
  // Handle the new API response format
  if (offer.uid && offer.nickName) {
    // Extract payment methods
    const paymentMethods = offer.paymentMethods 
      ? (Array.isArray(offer.paymentMethods) ? offer.paymentMethods : [offer.paymentMethods])
      : ['Bank Transfer'];
      
    // Generate a unique order ID based on available data
    const orderId = offer.orderId || offer.id || `okx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: orderId,
      advNo: orderId, // Add advNo as alias for order-book component
      tradeType: tradeType,
      cryptoCurrency: crypto,
      fiatCurrency: fiat,
      price: parseFloat(offer.price || '0'),
      amount: parseFloat(offer.availableAmount || offer.amount || offer.surplusAmount || '0'),
      maxAmount: parseFloat(offer.maxAmount || offer.maxSingleTransAmount || '9999'),
      minAmount: parseFloat(offer.minAmount || offer.minSingleTransAmount || '100'),
      paymentMethods: paymentMethods,
      merchant: {
        name: offer.nickName,
        rating: parseFloat(offer.positiveRate || '0.98'),
        completedTrades: parseInt(offer.orderCount || offer.completedOrderCount || '0'),
        completionRate: parseFloat(offer.completionRate || '0.95'),
        lastOnlineTime: offer.lastActiveTime || Date.now() - 600000,
        userType: offer.userType || 'normal',
        userIdentity: offer.uid || ''
      }
    };
  }
  
  // Handle legacy API format
  const paymentMethods = offer.payments?.map((payment: any) => payment.name || payment) || 
                        (offer.paymentMethods ? offer.paymentMethods.split(',') : ['Bank Transfer']);
  
  const orderId = offer.publicOrderId || offer.orderId || offer.id || `okx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: orderId,
    advNo: orderId, // Add advNo as alias for order-book component
    tradeType: offer.side?.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
    cryptoCurrency: offer.base || offer.asset || offer.cryptoCurrency || crypto,
    fiatCurrency: offer.quote || offer.currency || offer.fiatCurrency || fiat,
    price: parseFloat(offer.price || '0'),
    amount: parseFloat(offer.availableAmount || offer.amount || offer.surplusAmount || '0'),
    maxAmount: parseFloat(offer.maxAmount || offer.maxSingleTransAmount || '0'),
    minAmount: parseFloat(offer.minAmount || offer.minSingleTransAmount || '0'),
    paymentMethods: paymentMethods.length > 0 ? paymentMethods : ['Bank Transfer'],
    merchant: {
      name: offer.nickName || offer.advertiser?.nickName || 'OKX User',
      rating: parseFloat(offer.goodFeedbackRate || offer.advertiser?.positiveRate || '0.98'),
      completedTrades: parseInt(offer.completedOrderNum || offer.orderCount || offer.advertiser?.monthOrderCount || '0'),
      completionRate: parseFloat(offer.orderCompletionRate || offer.advertiser?.monthFinishRate || '0.95'),
      lastOnlineTime: offer.lastActiveTime || offer.advertiser?.lastActiveTime || Date.now(),
      userType: offer.userType || offer.advertiser?.userType || 'normal',
      userIdentity: offer.userId || offer.advertiser?.uid || `okx-user-${Date.now()}`
    }
  };
}

// Format OKX P2P API response data to our common structure
export function formatOKXOrders(apiResponse: any, fiat: string, crypto: string, tradeType: string) {
  console.log("Formatting OKX orders, received apiResponse type:", typeof apiResponse);
  
  let offers: any[] = [];
  
  try {
    // Handle the new API response format with buy/sell arrays
    if (apiResponse.data && apiResponse.data.buy && apiResponse.data.sell) {
      offers = tradeType.toLowerCase() === 'buy' ? apiResponse.data.buy : apiResponse.data.sell;
    }
    // Handle direct array of offers
    else if (Array.isArray(apiResponse)) {
      offers = apiResponse;
    }
    // Handle any other response format
    else if (apiResponse.data) {
      offers = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];
    }
  } catch (err) {
    console.error('Error extracting offers from OKX API response:', err);
    offers = [];
  }
  
  console.log(`Found ${offers.length} offers in OKX API response`);
  
  // Ensure we have an array
  if (!Array.isArray(offers)) {
    console.error('Extracted offers are not an array:', offers);
    offers = [];
  }
  
  // Transform each OKX offer to our format
  const orders = offers.map(offer => {
    return {
      id: offer.id,
      advNo: offer.id,
      tradeType: tradeType,
      cryptoCurrency: crypto,
      fiatCurrency: fiat,
      price: parseFloat(offer.price || '0'),
      amount: parseFloat(offer.availableAmount || '0'),
      maxAmount: parseFloat(offer.quoteMaxAmountPerOrder || '0'),
      minAmount: parseFloat(offer.quoteMinAmountPerOrder || '0'),
      paymentMethods: Array.isArray(offer.paymentMethods) ? offer.paymentMethods : [offer.paymentMethods],
      merchant: {
        name: offer.nickName || 'OKX User',
        rating: 1 - (parseInt(offer.cancelledOrderQuantity || '0') / parseInt(offer.completedOrderQuantity || '1')),
        completedTrades: parseInt(offer.completedOrderQuantity || '0'),
        completionRate: parseFloat(offer.completedRate || '0'),
        lastOnlineTime: Date.now(),
        userType: offer.creatorType || 'normal',
        userIdentity: offer.publicUserId || offer.merchantId || ''
      }
    };
  });
  
  console.log(`Formatted ${orders.length} OKX orders`);
  
  return {
    orders,
    fiat,
    crypto,
    tradeType,
    ordersCount: orders.length,
    isMockData: false
  };
} 