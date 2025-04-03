# OKX P2P API Integration

This document outlines the implementation of OKX P2P API integration for fetching real-time peer-to-peer market data.

## Overview

The integration allows the application to fetch real P2P order data from OKX's public P2P API endpoint. It includes fallback mechanisms to use mock data when the real API isn't accessible or returns errors.

## Implementation Details

### Endpoints Used

- Main OKX P2P Endpoint: `/api/v5/p2p/public/offers`

This is a public endpoint that doesn't require authentication, providing access to the current P2P offers available on the OKX platform.

### Request Parameters

The implementation maps our application's parameters to OKX's expected format:

- `fiat` → `currency`: The fiat currency code (e.g., USD, EUR)
- `crypto` → `asset`: The cryptocurrency code (e.g., USDT, BTC)
- `tradeType` → `side`: BUY/SELL converted to OKX's buy/sell perspective
  - Note: OKX uses "buy" when the advertiser is buying crypto (user would sell)
  - and "sell" when the advertiser is selling crypto (user would buy)

Additional parameters:
- `page`: Page number for pagination (default: 1)
- `size`: Number of results per page (default: 20)

### Data Structure

The API response is transformed to match our application's existing data format for consistency with the Binance P2P implementation. The formatter converts OKX's data structure to our standardized format:

```typescript
{
  success: boolean,
  isMockData: boolean,
  mockReason: string | null,
  orders: Array<{
    id: string,
    tradeType: string,
    cryptoCurrency: string,
    fiatCurrency: string,
    price: string,
    maxAmount: string,
    minAmount: string,
    availableAmount: string,
    paymentMethods: string[],
    advertiser: {
      uid: string,
      nickName: string,
      userType: string,
      monthOrderCount: number,
      monthFinishRate: number,
      positiveRate: number,
      userGrade: number,
      isOnline: boolean,
      lastActiveTime: number
    }
  }>,
  fiat: string,
  crypto: string,
  tradeType: string,
  ordersCount: number
}
```

### Error Handling

The implementation includes robust error handling:

1. **Connectivity Check**: Before attempting to fetch P2P data, the implementation tests connectivity with OKX's public API through a simple endpoint.

2. **Fallback to Mock Data**: If any part of the real API call fails (connectivity issues, API errors, empty results), the system falls back to generated mock data with a reason indicating why.

3. **Logging**: Comprehensive logging is implemented to track API requests, responses, and any errors for debugging purposes.

## Usage

To fetch OKX P2P data, make a GET request to:

```
/api/p2p/okx?fiat=USD&crypto=USDT&tradeType=BUY
```

Query parameters:
- `fiat`: Fiat currency code (default: USD)
- `crypto`: Cryptocurrency code (default: USDT)
- `tradeType`: BUY or SELL, from the user's perspective (default: BUY)

## Limitations and Considerations

1. **Rate Limiting**: OKX may implement rate limiting on their public APIs. The current implementation doesn't include specific handling for rate limits.

2. **Regional Restrictions**: OKX P2P API access may vary by region. Some IP addresses or regions might be restricted from accessing certain data.

3. **API Changes**: OKX may update their API structure without notice. If the API format changes, the formatter module may need to be updated.

## Future Improvements

1. **Caching**: Implement caching to reduce the number of API calls and provide a fallback when rate limited.

2. **Additional Parameters**: Support more OKX P2P API parameters like payment methods filtering.

3. **Pagination**: Support retrieving multiple pages of results when needed.

4. **WebSocket**: If OKX adds WebSocket support for P2P data in the future, update the implementation to use it for real-time updates. 