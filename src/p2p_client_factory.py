"""
P2P Client Factory for managing multiple exchange clients
"""

from typing import Dict, Optional, List, Set
import os
import inspect
from p2p_market_analysis.binance.p2p_client import BinanceP2PClient
from okx_client import OKXP2PClient

class P2PClientFactory:
    """Factory class for managing multiple P2P exchange clients"""
    
    def __init__(
        self,
        enable_historical: bool = False,
        enable_alerts: bool = False,
        enable_notifications: bool = False,
        enable_sentiment: bool = False
    ):
        self.clients: Dict[str, object] = {}
        self.data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.settings = {
            'enable_historical': enable_historical,
            'enable_alerts': enable_alerts,
            'enable_notifications': enable_notifications,
            'enable_sentiment': enable_sentiment,
            'data_dir': self.data_dir
        }
        
        # Initialize supported exchanges
        self._init_clients()
    
    def _filter_settings(self, client_class) -> dict:
        """Filter settings based on client constructor parameters"""
        sig = inspect.signature(client_class.__init__)
        valid_params = [param.name for param in sig.parameters.values()]
        return {k: v for k, v in self.settings.items() if k in valid_params}
    
    def _init_clients(self):
        """Initialize all supported exchange clients"""
        # Initialize Binance client with filtered settings
        binance_settings = self._filter_settings(BinanceP2PClient)
        self.clients['binance'] = BinanceP2PClient(**binance_settings)
        
        # Initialize OKX client with filtered settings
        okx_settings = self._filter_settings(OKXP2PClient)
        self.clients['okx'] = OKXP2PClient(**okx_settings)
    
    def get_client(self, exchange: str) -> Optional[object]:
        """Get client instance for specific exchange"""
        return self.clients.get(exchange.lower())
    
    def get_supported_exchanges(self) -> List[str]:
        """Get list of supported exchanges"""
        return list(self.clients.keys())
    
    def get_supported_pairs(self, exchange: str, fiat: str) -> Set[str]:
        """Get supported trading pairs for specific exchange and fiat"""
        client = self.get_client(exchange)
        if client:
            return client.get_supported_cryptocurrencies(fiat)
        return set()
    
    def get_best_offers(
        self,
        fiat: str,
        crypto: str,
        trade_type: str = "BUY",
        payment_methods: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        max_price_deviation: Optional[float] = None,
        min_merchant_rate: Optional[float] = None
    ) -> Dict[str, List]:
        """Get best offers across all exchanges"""
        results = {}
        
        for exchange, client in self.clients.items():
            try:
                offers = client.get_p2p_prices(
                    fiat=fiat,
                    crypto=crypto,
                    trade_type=trade_type,
                    payment_methods=payment_methods,
                    min_amount=min_amount,
                    max_amount=max_amount,
                    max_price_deviation=max_price_deviation
                )
                
                # Filter by merchant rate if specified
                if min_merchant_rate and offers:
                    offers = [
                        o for o in offers
                        if o.month_finish_rate >= min_merchant_rate
                    ]
                
                if offers:
                    results[exchange] = offers
                    
            except Exception as e:
                print(f"Error getting offers from {exchange}: {str(e)}")
                continue
        
        return results
    
    def get_arbitrage_opportunities(
        self,
        fiat: str,
        cryptos: Optional[List[str]] = None,
        min_profit_percent: float = 0.5,
        payment_methods: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None
    ) -> List[Dict]:
        """Find arbitrage opportunities across exchanges"""
        opportunities = []
        
        # If no specific cryptocurrencies provided, get all supported ones
        if not cryptos:
            all_supported = set()
            for exchange in self.clients:
                supported = self.get_supported_pairs(exchange, fiat)
                all_supported.update(supported)
            cryptos = list(all_supported)
        
        for crypto in cryptos:
            # Get all buy and sell offers
            all_offers = self.get_best_offers(
                fiat=fiat,
                crypto=crypto,
                payment_methods=payment_methods,
                min_amount=min_amount,
                max_amount=max_amount
            )
            
            # Find arbitrage opportunities between exchanges
            for buy_exchange, buy_offers in all_offers.items():
                for sell_exchange, sell_offers in all_offers.items():
                    if not buy_offers or not sell_offers:
                        continue
                        
                    # Sort offers by price
                    buy_offers = sorted(buy_offers, key=lambda x: x.price)
                    sell_offers = sorted(sell_offers, key=lambda x: x.price, reverse=True)
                    
                    for buy_offer in buy_offers:
                        for sell_offer in sell_offers:
                            # Calculate profit percentage
                            profit_percent = (
                                (sell_offer.price - buy_offer.price) / buy_offer.price * 100
                            )
                            
                            if profit_percent >= min_profit_percent:
                                opportunities.append({
                                    'crypto': crypto,
                                    'fiat': fiat,
                                    'buy_exchange': buy_exchange,
                                    'sell_exchange': sell_exchange,
                                    'buy_price': buy_offer.price,
                                    'sell_price': sell_offer.price,
                                    'profit_percent': profit_percent,
                                    'max_trade_amount': min(
                                        buy_offer.available_amount,
                                        sell_offer.available_amount
                                    ),
                                    'buy_merchant': {
                                        'name': buy_offer.advertiser,
                                        'completion_rate': buy_offer.month_finish_rate,
                                        'risk_score': buy_offer.merchant_risk.risk_score
                                    },
                                    'sell_merchant': {
                                        'name': sell_offer.advertiser,
                                        'completion_rate': sell_offer.month_finish_rate,
                                        'risk_score': sell_offer.merchant_risk.risk_score
                                    }
                                })
        
        # Sort opportunities by profit percentage
        return sorted(
            opportunities,
            key=lambda x: x['profit_percent'],
            reverse=True
        ) 