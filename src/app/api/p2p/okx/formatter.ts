/**
 * Formatter for OKX P2P API response
 * This module transforms the OKX P2P API response data into our standardized format
 * for consistency with our Binance implementation
 */

export interface OKXAdvertiser {
  publicUserId: string;     // User ID
  nickName: string;         // Nickname
  userType: string;         // User type (normal, merchant, etc.)
  completedOrderQuantity?: number; // Orders completed
  completedRate?: string;   // Order completion rate
  posReviewPercentage?: string;   // Positive feedback rate
  creatorType?: string;     // User level/grade
  userActiveStatusVo?: any; // Online status
}

export interface OKXOffer {
  id: string;               // Offer ID
  side: string;            // buy or sell
  baseCurrency: string;    // e.g., BTC, USDT
  quoteCurrency: string;   // e.g., USD, EUR
  price: string;           // Price per crypto unit
  quoteMaxAmountPerOrder: string; // Max transaction amount
  quoteMinAmountPerOrder: string; // Min transaction amount
  availableAmount: string; // Available amount
  paymentMethods: string[]; // Accepted payment methods
}

// Format OKX P2P API response data to our common structure
export function formatOKXOrders(response: any, fiat: string, crypto: string, tradeType: string) {
  try {
    if (!response.data) {
      console.warn('Invalid OKX response format:', response);
      return [];
    }

    // Get the appropriate array based on trade type
    const ordersArray = response.data[tradeType.toLowerCase()] || [];

    if (!Array.isArray(ordersArray)) {
      console.warn('OKX orders array is not valid:', ordersArray);
      return [];
    }

    console.log(`Processing ${ordersArray.length} ${tradeType} orders from OKX`);

    const orders = ordersArray.map((offer: any) => ({
      id: offer.id || `okx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      advNo: offer.id || `okx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      price: parseFloat(offer.price) || 0,
      amount: parseFloat(offer.availableAmount) || 0,
      minAmount: parseFloat(offer.quoteMinAmountPerOrder) || 100,
      maxAmount: parseFloat(offer.quoteMaxAmountPerOrder) || 9999,
      paymentMethods: Array.isArray(offer.paymentMethods) ? offer.paymentMethods : ['Bank Transfer'],
      merchant: {
        name: offer.nickName || 'Unknown',
        rating: parseFloat(offer.posReviewPercentage || '-1') > 0 ? 
          parseFloat(offer.posReviewPercentage) / 100 : 
          0.98,
        completedTrades: parseInt(offer.completedOrderQuantity || '0'),
        completionRate: parseFloat(offer.completedRate || '0.95'),
        lastOnlineTime: Date.now() / 1000,
        userType: offer.userType || 'common',
        userIdentity: offer.publicUserId || `okx-user-${Date.now()}`
      }
    }));

    // Filter out any invalid orders
    const validOrders = orders.filter((order: any) => 
      !isNaN(order.price) && 
      !isNaN(order.amount) && 
      order.amount > 0 && 
      order.price > 0
    );

    // Log the first order for debugging
    if (validOrders.length > 0) {
      console.log('Sample formatted OKX order:', validOrders[0]);
    }

    return validOrders;
  } catch (error) {
    console.error('Error formatting OKX orders:', error);
    return [];
  }
} 