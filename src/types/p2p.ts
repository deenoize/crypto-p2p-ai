export interface P2PMerchant {
  name: string;
  rating: number;
  completedTrades: number;
  completionRate: number;
  lastOnlineTime: number;
  userType: string;
  userIdentity: string;
}

export interface P2POrder {
  advNo: string;
  price: number;
  amount: number;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  merchant: P2PMerchant;
}

export interface P2POrdersResponse {
  buyOrders: P2POrder[];
  sellOrders: P2POrder[];
  hasChanges: boolean;
  hasMore: boolean;
}

export type OrderType = 'buy' | 'sell'; 