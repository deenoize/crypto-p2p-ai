"""
Main script for the OpenAI Operator with enhanced P2P and arbitrage analysis
"""

from src.openai.client import get_completion
from src.binance.client import get_market_data
from src.binance.p2p_client import BinanceP2PClient
from src.utils.data_processing import ohlcv_to_dataframe, calculate_technical_indicators
from typing import List, Dict, Any, Set
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('OpenAIOperator')

def get_supported_pairs() -> Dict[str, Any]:
    """
    Get all supported fiat currencies and their corresponding cryptocurrencies
    
    Returns:
        Dict[str, Any]: Dictionary containing supported pairs and statistics
    """
    p2p_client = BinanceP2PClient()
    
    # Get all supported fiat currencies
    fiat_currencies = p2p_client.get_supported_fiat_currencies()
    
    # Get supported cryptocurrencies for each fiat
    pairs_data = {}
    for fiat in fiat_currencies:
        cryptos = p2p_client.get_supported_cryptocurrencies(fiat)
        pairs_data[fiat] = list(cryptos)
    
    return {
        'fiat_count': len(fiat_currencies),
        'fiat_currencies': list(fiat_currencies),
        'pairs_by_fiat': pairs_data,
        'timestamp': datetime.now().isoformat()
    }

def validate_trading_pair(fiat: str, crypto: str) -> bool:
    """
    Validate if a fiat-crypto pair is supported
    
    Args:
        fiat (str): Fiat currency code
        crypto (str): Cryptocurrency code
        
    Returns:
        bool: Whether the pair is supported
    """
    p2p_client = BinanceP2PClient()
    return p2p_client.is_valid_pair(fiat, crypto)

def analyze_market(
    symbol: str = 'BTC/USDT',
    fiat: str = 'USD',
    payment_methods: List[str] = None,
    min_amount: float = None,
    max_amount: float = None
) -> str:
    """
    Analyze market data using OpenAI with enhanced P2P analysis
    
    Args:
        symbol (str): Trading pair symbol
        fiat (str): Fiat currency for P2P analysis
        payment_methods (List[str]): Specific payment methods to consider
        min_amount (float): Minimum transaction amount
        max_amount (float): Maximum transaction amount
        
    Returns:
        str: Market analysis from OpenAI
    """
    logger.info(f"Analyzing market for {symbol} with {fiat} P2P comparison")
    
    # Extract crypto from symbol
    crypto = symbol.split('/')[1]  # Extract the quote currency (e.g., USDT from BTC/USDT)
    
    # Validate the pair
    if not validate_trading_pair(fiat, crypto):
        return f"Error: The pair {fiat}/{crypto} is not supported on Binance P2P"
    
    # Get spot/futures market data
    ohlcv_data = get_market_data(symbol)
    df = ohlcv_to_dataframe(ohlcv_data)
    df = calculate_technical_indicators(df)
    latest_data = df.iloc[-1]
    
    # Get P2P market data with enhanced filtering
    p2p_client = BinanceP2PClient()
    
    # Get supported payment methods if none specified
    if not payment_methods:
        available_methods = p2p_client.get_supported_payment_methods(fiat)
        payment_methods = [method.identifier for method in available_methods]
    
    best_buy_offer = p2p_client.get_best_p2p_price(
        fiat=fiat,
        crypto=crypto,
        trade_type="BUY",
        payment_methods=payment_methods,
        min_available_amount=min_amount,
        required_merchant=True,
        min_registration_days=30
    )
    
    best_sell_offer = p2p_client.get_best_p2p_price(
        fiat=fiat,
        crypto=crypto,
        trade_type="SELL",
        payment_methods=payment_methods,
        min_available_amount=min_amount,
        required_merchant=True,
        min_registration_days=30
    )
    
    # Calculate potential arbitrage
    spot_price = latest_data['close']
    p2p_buy_price = best_buy_offer.price if best_buy_offer else None
    p2p_sell_price = best_sell_offer.price if best_sell_offer else None
    
    arbitrage_opportunities = []
    if p2p_buy_price and p2p_sell_price:
        # P2P internal arbitrage
        p2p_profit_percentage = ((p2p_sell_price - p2p_buy_price) / p2p_buy_price) * 100
        if p2p_profit_percentage > 1.0:
            arbitrage_opportunities.append({
                'type': 'P2P Internal',
                'profit_percentage': p2p_profit_percentage,
                'details': f"Buy at {p2p_buy_price} and sell at {p2p_sell_price}"
            })
        
        # Spot to P2P arbitrage
        spot_to_p2p_profit = ((p2p_sell_price - spot_price) / spot_price) * 100
        if spot_to_p2p_profit > 1.0:
            arbitrage_opportunities.append({
                'type': 'Spot to P2P',
                'profit_percentage': spot_to_p2p_profit,
                'details': f"Buy spot at {spot_price} and sell P2P at {p2p_sell_price}"
            })
        
        # P2P to Spot arbitrage
        p2p_to_spot_profit = ((spot_price - p2p_buy_price) / p2p_buy_price) * 100
        if p2p_to_spot_profit > 1.0:
            arbitrage_opportunities.append({
                'type': 'P2P to Spot',
                'profit_percentage': p2p_to_spot_profit,
                'details': f"Buy P2P at {p2p_buy_price} and sell spot at {spot_price}"
            })
    
    # Prepare prompt for OpenAI
    prompt = f"""
    Analyze the following market data for {symbol} as of {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}:
    
    Spot/Futures Market:
    - Current price: {latest_data['close']}
    - RSI: {latest_data['RSI']:.2f}
    - SMA_20: {latest_data['SMA_20']:.2f}
    - 24h Volume: {latest_data['volume']:.2f}
    
    P2P Market ({fiat}):
    - Best Buy Offer: {best_buy_offer.price if best_buy_offer else 'N/A'} {fiat}
    - Best Sell Offer: {best_sell_offer.price if best_sell_offer else 'N/A'} {fiat}
    - Buy Offer Details: 
      * Merchant: {best_buy_offer.advertiser if best_buy_offer else 'N/A'}
      * Completion Rate: {best_buy_offer.completion_rate*100:.1f}% if best_buy_offer else 'N/A'
      * Available Amount: {best_buy_offer.available_amount if best_buy_offer else 'N/A'} {crypto}
      * Payment Methods: {[method.name for method in best_buy_offer.payment_methods] if best_buy_offer else 'N/A'}
    
    Arbitrage Opportunities:
    {arbitrage_opportunities if arbitrage_opportunities else 'No significant arbitrage opportunities found'}
    
    Please provide:
    1. Technical Analysis:
       - Trend analysis based on price and SMA
       - RSI interpretation and potential signals
       - Volume analysis and its implications
    
    2. P2P Market Analysis:
       - Price comparison with spot market
       - Best entry and exit points
       - Payment method recommendations
       - Risk assessment of available merchants
    
    3. Arbitrage Opportunities:
       - Detailed analysis of each opportunity
       - Required capital and potential returns
       - Risk factors and considerations
       - Execution strategy recommendations
    
    4. Overall Recommendation:
       - Best trading strategy given current conditions
       - Risk management suggestions
       - Timing considerations
    """
    
    return get_completion(prompt)

def analyze_arbitrage_opportunities(
    fiat: str = 'USD',
    min_profit_percentage: float = 1.0,
    payment_methods: List[str] = None
) -> str:
    """
    Analyze arbitrage opportunities across different markets
    
    Args:
        fiat (str): Fiat currency
        min_profit_percentage (float): Minimum profit percentage to consider
        payment_methods (List[str]): Specific payment methods to consider
        
    Returns:
        str: Arbitrage analysis from OpenAI
    """
    logger.info(f"Analyzing arbitrage opportunities for {fiat}")
    
    p2p_client = BinanceP2PClient()
    opportunities = p2p_client.find_arbitrage_opportunities(
        fiat=fiat,
        min_profit_percentage=min_profit_percentage
    )
    
    prompt = f"""
    Analyze the following arbitrage opportunities in {fiat} market:
    
    {opportunities}
    
    Please provide:
    1. Ranking of opportunities by:
       - Profit potential
       - Risk level
       - Ease of execution
    
    2. For each opportunity:
       - Required capital
       - Estimated execution time
       - Potential risks and mitigation strategies
       - Recommended payment methods
    
    3. Overall strategy:
       - Best opportunities to focus on
       - Risk management approach
       - Timing considerations
    """
    
    return get_completion(prompt)

def list_supported_pairs() -> str:
    """
    Get a human-readable analysis of supported trading pairs
    
    Returns:
        str: Analysis of supported trading pairs from OpenAI
    """
    pairs_data = get_supported_pairs()
    
    prompt = f"""
    Analyze the following supported trading pairs on Binance P2P:
    
    Data as of: {pairs_data['timestamp']}
    Total Fiat Currencies: {pairs_data['fiat_count']}
    
    Supported Pairs:
    {pairs_data['pairs_by_fiat']}
    
    Please provide:
    1. Overview of supported fiat currencies by region
    2. Most widely supported cryptocurrencies
    3. Notable patterns or limitations
    4. Recommendations for:
       - Most liquid pairs
       - Best pairs for different regions
       - Pairs to avoid
    """
    
    return get_completion(prompt)

if __name__ == "__main__":
    # List all supported pairs
    print("\nSupported Pairs Analysis:")
    pairs_analysis = list_supported_pairs()
    print(pairs_analysis)
    
    # Example: Analyze a specific market
    analysis = analyze_market(
        symbol='USDT/BUSD',
        fiat='USD',
        payment_methods=['BANK', 'WISE'],
        min_amount=1000
    )
    print("\nMarket Analysis:")
    print(analysis)
    
    # Analyze arbitrage opportunities
    arbitrage_analysis = analyze_arbitrage_opportunities(
        fiat='USD',
        min_profit_percentage=1.0,
        payment_methods=['BANK', 'WISE']
    )
    print("\nArbitrage Analysis:")
    print(arbitrage_analysis) 