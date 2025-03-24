"""
Binance client configuration and setup
"""

import ccxt
from src.config import BINANCE_API_KEY, BINANCE_SECRET_KEY

def create_client():
    """
    Create and configure the Binance client
    """
    return ccxt.binance({
        'apiKey': BINANCE_API_KEY,
        'secret': BINANCE_SECRET_KEY,
        'enableRateLimit': True,
        'options': {
            'defaultType': 'future',  # or 'spot' for spot trading
        }
    })

def get_market_data(symbol: str = 'BTC/USDT', timeframe: str = '1h', limit: int = 100):
    """
    Get market data from Binance
    
    Args:
        symbol (str): Trading pair symbol
        timeframe (str): Candlestick timeframe
        limit (int): Number of candlesticks to fetch
        
    Returns:
        list: List of OHLCV data
    """
    exchange = create_client()
    return exchange.fetch_ohlcv(symbol, timeframe, limit=limit) 