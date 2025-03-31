import { Router, Request, Response, RequestHandler } from 'express';
import axios, { AxiosError } from 'axios';

const router = Router();

const getP2PHandler: RequestHandler = async (req, res) => {
  try {
    const { fiat, crypto, tradeType } = req.query;
    
    const params = {
      quoteCurrency: fiat || 'USD',
      baseCurrency: crypto || 'USDT',
      side: tradeType?.toString().toLowerCase() === 'buy' ? 'sell' : 'buy', // Invert the side for OKX
      paymentMethod: 'ALL',
      limit: '20',
      offset: '0'
    };

    const headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://www.okx.com',
      'Referer': 'https://www.okx.com/p2p-markets',
      'x-cdn': '1',
      'x-locale': 'en_US'
    };

    console.log('Making request to OKX P2P API:', {
      url: 'https://www.okx.com/api/v5/c2c/advertisement/list',
      params,
      headers
    });

    const response = await axios.get('https://www.okx.com/api/v5/c2c/advertisement/list', {
      params,
      headers,
      timeout: 10000,
      validateStatus: (status) => status < 500
    });

    console.log('OKX API Response:', response.data);
    res.json(response.data);
  } catch (error: unknown) {
    console.error('Error fetching OKX P2P data:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
          params: axiosError.config?.params
        }
      });
      
      res.status(axiosError.response?.status || 500).json({
        error: 'Failed to fetch P2P data',
        details: axiosError.response?.data || axiosError.message
      });
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: 'Failed to fetch P2P data', details: errorMessage });
    }
  }
};

router.get('/', getP2PHandler);

export default router; 