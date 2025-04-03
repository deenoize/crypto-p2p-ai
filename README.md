# Crypto P2P AI

A modern, real-time P2P cryptocurrency trading platform with AI-powered insights and analysis. This dashboard helps traders identify the best opportunities in P2P markets with a beautiful, responsive interface.

![Crypto P2P AI Dashboard](https://github.com/deenoize/crypto-p2p-ai/raw/main/public/preview.png)

## Features

- **Real-time Order Book**: View buy and sell orders with detailed merchant information
- **Advanced Filtering**: Filter by payment methods, amount ranges, and merchant ratings
- **Price Analytics**: Track price trends and identify arbitrage opportunities
- **Merchant Insights**: AI-powered merchant reliability scoring
- **Dark Mode Support**: Beautiful UI in both light and dark themes
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **Data Visualization**: Chart.js with react-chartjs-2
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/deenoize/crypto-p2p-ai.git
cd crypto-p2p-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file with your configuration:
```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project can be easily deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fdeenoize%2Fcrypto-p2p-ai)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## OKX P2P Integration

We have implemented support for the OKX P2P API to fetch real-time peer-to-peer market data. The implementation follows these key principles:

1. **Compatible Data Format**: The OKX P2P data is transformed to match our existing Binance P2P data structure, ensuring compatibility with the frontend.

2. **Robust Error Handling**: The implementation includes comprehensive error handling with fallback to mock data when the real API is unavailable.

3. **Modular Architecture**: The code is organized into clear modules:
   - `route.ts`: Main API endpoint handler and logic
   - `formatter.ts`: Converts OKX data to our standard format
   - `mockData.ts`: Generates realistic mock data for fallback

### Current Status

The implementation is fully functional but currently falls back to mock data because:
- OKX's P2P API endpoint `/api/v5/p2p/public/offers` returns 404 errors in our testing
- This could be due to regional restrictions, IP blocking, or changes in OKX's API

### Next Steps

To get real data from OKX, we may need to:
1. Try different OKX API endpoints or parameters
2. Contact OKX support to understand any access restrictions
3. Use a VPN or proxy if region-restricted
4. Consider implementing OKX's authentication if the endpoint requires it

### Documentation

For more detailed information on the OKX P2P implementation, see [OKX_P2P_INTEGRATION.md](./OKX_P2P_INTEGRATION.md). 