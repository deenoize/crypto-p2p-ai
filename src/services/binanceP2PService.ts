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
}

interface P2POrdersResponse {
  buyOrders: P2POrder[];
  sellOrders: P2POrder[];
  hasChanges?: boolean;
}

export class BinanceP2PService {
  private previousBuyOrders: Set<string> = new Set();
  private previousSellOrders: Set<string> = new Set();

  private log(message: string) {
    console.log(message);
  }

  private error(message: string, error: any) {
    console.error(message, error);
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
      const response = await axios.post('/api/p2p', {
        fiat,
        crypto,
        tradeType
      });

      if (!response.data?.data) {
        throw new Error('Invalid API response structure');
      }

      return response.data.data.map((item: any) => {
        console.log('Processing merchant data:', {
          name: item.advertiser.nickName,
          activeTimeInSecond: item.advertiser.activeTimeInSecond,
          type: typeof item.advertiser.activeTimeInSecond
        });
        
        let lastOnlineTime;
        if (item.advertiser.activeTimeInSecond) {
          lastOnlineTime = Math.floor(Date.now() / 1000) - item.advertiser.activeTimeInSecond;
        }

        console.log('Final calculated time:', {
          activeTimeInSecond: item.advertiser.activeTimeInSecond,
          calculated: lastOnlineTime,
          isValid: Boolean(lastOnlineTime)
        });

        return {
          advNo: item.adv.advNo,
          price: item.adv.price,
          amount: item.adv.surplusAmount,
          minAmount: item.adv.minSingleTransAmount,
          maxAmount: item.adv.maxSingleTransAmount,
          paymentMethods: item.adv.tradeMethods.map((method: any) => method.identifier),
          merchant: {
            name: item.advertiser.nickName,
            rating: item.advertiser.positiveRate,
            completedTrades: item.advertiser.monthOrderCount,
            completionRate: item.advertiser.monthFinishRate,
            lastOnlineTime,
            userType: item.advertiser.userType,
            userIdentity: item.advertiser.userIdentity
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

export const binanceP2PService = new BinanceP2PService(); 