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
}

interface P2POrdersResponse {
  buyOrders: P2POrder[];
  sellOrders: P2POrder[];
  hasChanges?: boolean;
}

export class OkxP2PService {
  private previousBuyOrders: Set<string> = new Set();
  private previousSellOrders: Set<string> = new Set();

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

  private async fetchOrders(fiat: string, crypto: string, tradeType: 'BUY' | 'SELL') {
    this.log(`Fetching ${tradeType} orders for ${fiat}/${crypto}`);

    try {
      const response = await axios.post('/api/p2p/okx', {
        fiat,
        crypto,
        tradeType
      });

      if (!response.data?.data) {
        throw new Error('Invalid API response structure');
      }

      return response.data.data.map((item: any, index: number) => {
        // OKX API response structure will need to be adapted here
        // This is a placeholder implementation until we know the actual structure
        
        let lastOnlineTime = 0;
        if (item.advertiser && item.advertiser.activeTimeInSecond) {
          lastOnlineTime = Math.floor(Date.now() / 1000) - item.advertiser.activeTimeInSecond;
        }

        // Parse and validate numeric values
        const price = parseFloat(item.adv?.price || '0');
        const amount = parseFloat(item.adv?.surplusAmount || '0');
        const minAmount = parseFloat(item.adv?.minSingleTransAmount || '0');
        const maxAmount = parseFloat(item.adv?.maxSingleTransAmount || '0');

        // Validate data before returning
        if (isNaN(price) || isNaN(amount) || isNaN(minAmount) || isNaN(maxAmount)) {
          console.error('Invalid number format in OKX order data:', {
            price: item.adv?.price,
            amount: item.adv?.surplusAmount,
            minAmount: item.adv?.minSingleTransAmount, 
            maxAmount: item.adv?.maxSingleTransAmount
          });
          return null; // This will be filtered out by .filter(Boolean)
        }

        // Ensure we always have a valid advNo, or create a unique one
        const advNo = (item.adv?.advNo || `okx-${tradeType}-${index}-${Date.now()}`).toString();

        return {
          advNo: advNo,
          id: advNo, // Add id as alias for easier usage in UI
          price: price,
          amount: amount,
          minAmount: minAmount,
          maxAmount: maxAmount,
          paymentMethods: item.adv?.tradeMethods ? item.adv.tradeMethods.map((method: any) => method.identifier) : [],
          merchant: {
            name: item.advertiser?.nickName || 'Unknown',
            rating: item.advertiser?.positiveRate || 0,
            completedTrades: item.advertiser?.monthOrderCount || 0,
            completionRate: item.advertiser?.monthFinishRate || 0,
            lastOnlineTime: lastOnlineTime || 0,
            userType: item.advertiser?.userType || 'user',
            userIdentity: item.advertiser?.userIdentity || ''
          }
        };
      }).filter(Boolean);
    } catch (error: any) {
      this.error('Error fetching P2P orders:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Failed to fetch orders'
      );
    }
  }

  async getOrders(fiat: string, crypto: string): Promise<P2POrdersResponse> {
    this.log(`Fetching orders for ${fiat}/${crypto}...`);

    try {
      const [buyOrders, sellOrders] = await Promise.all([
        this.fetchOrders(fiat, crypto, 'BUY'),
        this.fetchOrders(fiat, crypto, 'SELL')
      ]);

      this.log(`Got orders: Buy: ${buyOrders.length}, Sell: ${sellOrders.length}`);

      const buyOrdersChanged = this.hasOrdersChanged(buyOrders, this.previousBuyOrders);
      const sellOrdersChanged = this.hasOrdersChanged(sellOrders, this.previousSellOrders);

      this.updatePreviousOrders(buyOrders, sellOrders);

      return {
        buyOrders,
        sellOrders,
        hasChanges: buyOrdersChanged || sellOrdersChanged
      };
    } catch (error: any) {
      this.error('Error getting P2P orders:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Export a singleton instance of the service
export const okxP2PService = new OkxP2PService(); 