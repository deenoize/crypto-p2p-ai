import { binanceP2PService } from '../binanceP2PService';
import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('binanceP2PService', () => {
  const mockSuccessResponse = {
    data: {
      data: [
        {
          adv: {
            price: '1.00',
            surplusAmount: '100',
            minSingleTransAmount: '10',
            maxSingleTransAmount: '1000',
            tradeMethods: [{ identifier: 'BANK' }]
          },
          advertiser: {
            nickName: 'TestMerchant',
            monthOrderCount: 100,
            monthFinishRate: 0.98,
            positiveRate: 0.99,
            userType: 'user',
            userIdentity: ''
          }
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.post.mockReset();
  });

  it('transforms API response correctly', async () => {
    mockAxios.post.mockResolvedValueOnce(mockSuccessResponse)
              .mockResolvedValueOnce(mockSuccessResponse);

    const result = await binanceP2PService.getOrders('USD', 'USDT');
    
    expect(result.buyOrders.length).toBe(1);
    expect(result.sellOrders.length).toBe(1);
    
    const order = result.buyOrders[0];
    expect(order.price).toBe('1.00');
    expect(order.amount).toBe('100');
    expect(order.minAmount).toBe('10');
    expect(order.maxAmount).toBe('1000');
    expect(order.paymentMethods).toEqual(['BANK']);
    expect(order.merchant.name).toBe('TestMerchant');
    expect(order.merchant.completedTrades).toBe(100);
    expect(order.merchant.completionRate).toBe(0.98);
    expect(order.merchant.rating).toBe(0.99);
  });

  it('handles empty response correctly', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: { data: [] } })
              .mockResolvedValueOnce({ data: { data: [] } });

    const result = await binanceP2PService.getOrders('USD', 'USDT');
    expect(result.buyOrders).toEqual([]);
    expect(result.sellOrders).toEqual([]);
  });

  it('handles invalid response data correctly', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: { data: null } })
              .mockResolvedValueOnce({ data: { data: null } });

    await expect(binanceP2PService.getOrders('USD', 'USDT')).rejects.toThrow('Invalid API response structure');
  });

  it('handles API error correctly', async () => {
    const errorResponse = {
      response: {
        data: {
          error: 'API Error'
        },
        status: 400
      }
    };
    mockAxios.post.mockRejectedValueOnce(errorResponse);

    await expect(binanceP2PService.getOrders('USD', 'USDT')).rejects.toThrow('API Error');
  });
}); 