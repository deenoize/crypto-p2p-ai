import axios from 'axios';

interface P2POrder {
  price: number;
  amount: number;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  merchant: {
    name: string;
    rating: number;
    completedTrades: number;
    completionRate: number;
    lastOnlineTime: number;
    userType: string;
    userIdentity: string;
  };
  advNo: string;
  id: string;
  isMock: boolean;
}

interface P2POrdersResponse {
  buyOrders: P2POrder[];
  sellOrders: P2POrder[];
  hasChanges?: boolean;
}

export class OkxP2PService {
  private previousBuyOrders: Set<string> = new Set();
  private previousSellOrders: Set<string> = new Set();

  constructor() {
    console.log('🔄 OKX P2P Service initialized');
    console.log('Attempting to use real OKX API with fallback to mock data');
    console.log('--------------------------------------------------------------');
  }

  private log(message: string) {
    console.log(`[OKX P2P] ${message}`);
  }

  private error(message: string, data?: any) {
    console.error(`[OKX P2P ERROR] ${message}`, data || '');
  }

  private hasOrdersChanged(newOrders: P2POrder[], previousOrderIds: Set<string>): boolean {
    const newOrderIds = new Set(newOrders.map(order => order.advNo));
    
    const hasRemovals = Array.from(previousOrderIds).some(id => !newOrderIds.has(id));
    const hasAdditions = Array.from(newOrderIds).some(id => !previousOrderIds.has(id));

    return hasRemovals || hasAdditions;
  }

  private updatePreviousOrders(buyOrders: P2POrder[], sellOrders: P2POrder[]) {
    this.previousBuyOrders = new Set(buyOrders.map(order => order.advNo));
    this.previousSellOrders = new Set(sellOrders.map(order => order.advNo));
  }

  private async fetchOrders(fiat: string, crypto: string, tradeType: 'BUY' | 'SELL'): Promise<any[]> {
    this.log(`Fetching ${tradeType} orders for ${crypto}/${fiat}`);
    try {
      // Use our backend endpoint that properly handles OKX API requests
      const response = await axios.get(`/api/p2p/okx?fiat=${fiat}&crypto=${crypto}&tradeType=${tradeType}`);
      
      // Check if we have a valid response with orders
      if (response.data && Array.isArray(response.data)) {
        this.log(`✅ Successfully fetched data from OKX API: ${response.data.length} orders found`);
        return response.data;
      } else {
        this.log('❌ No valid orders found in response');
        return [];
      }
    } catch (error: any) {
      this.log(`❌ Error fetching OKX orders: ${error.message}`);
      return [];
    }
  }

  async getOrders(fiat: string, crypto: string): Promise<P2POrdersResponse> {
    this.log(`Getting orders for ${crypto}/${fiat}`);
    try {
      // Fetch both buy and sell orders
      const [buyOrders, sellOrders] = await Promise.all([
        this.fetchOrders(fiat, crypto, 'BUY'),
        this.fetchOrders(fiat, crypto, 'SELL')
      ]);
      
      // Check for any mock data
      const hasMockData = buyOrders.some(order => order.isMock) || sellOrders.some(order => order.isMock);
      if (hasMockData) {
        this.log('⚠️ Using mock OKX P2P data (real API access might not be available)');
      } else {
        this.log(`✅ Using real OKX P2P data: ${buyOrders.length} buy orders, ${sellOrders.length} sell orders`);
      }
      
      // Check if order IDs have changed from previous
      const hasChanges = (
        (buyOrders.length > 0 && this.hasOrdersChanged(buyOrders, this.previousBuyOrders)) || 
        (sellOrders.length > 0 && this.hasOrdersChanged(sellOrders, this.previousSellOrders))
      );
      
      // Update previous order IDs
      this.updatePreviousOrders(buyOrders, sellOrders);
      
      return {
        buyOrders,
        sellOrders,
        hasChanges
      };
    } catch (err: any) {
      this.error('Error getting P2P orders:', {
        message: err.message,
        data: err.response?.data
      });
      throw err;
    }
  }
}

// Export a singleton instance of the service
export const okxP2PService = new OkxP2PService(); 