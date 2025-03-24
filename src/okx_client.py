"""
OKX P2P Client Implementation
"""

import logging
import requests
from typing import List, Set, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
import time
import os
import base64
import hmac
import hashlib
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('okx.p2p_client')

# Get API credentials from environment variables
OKX_API_KEY = os.getenv('OKX_API_KEY')
OKX_SECRET_KEY = os.getenv('OKX_SECRET_KEY')
OKX_PASSPHRASE = os.getenv('OKX_PASSPHRASE')

@dataclass
class PaymentMethod:
    """Payment method data structure"""
    name: str
    identifier: str
    
@dataclass
class MerchantRisk:
    """Merchant risk assessment data structure"""
    risk_score: float
    risk_level: str
    warning_message: Optional[str] = None

@dataclass
class P2POffer:
    """P2P offer data structure"""
    advertiser: str
    price: float
    available_amount: float
    min_amount: float
    max_amount: float
    payment_methods: List[PaymentMethod]
    crypto: str
    fiat: str
    trade_type: str
    merchant_risk: MerchantRisk
    month_order_count: int
    month_finish_rate: float
    positive_rate: float
    user_type: str
    user_grade: int
    user_identity: str
    badges: List[str]
    vip_level: Optional[int]
    active_time_in_second: int
    volume_24h: float = 0.0
    price_deviation: float = 0.0

class OKXP2PClient:
    """OKX P2P Client implementation"""
    
    def __init__(
        self,
        enable_historical: bool = False,
        enable_alerts: bool = False,
        enable_notifications: bool = False,
        enable_sentiment: bool = False
    ):
        self.base_url = "https://www.okx.com"
        self.api_base = f"{self.base_url}/api/v5/p2p"
        self.supported_pairs: Set[str] = set()
        self.historical_data: Dict[str, List[Dict]] = {}
        self.enable_historical = enable_historical
        self.enable_alerts = enable_alerts
        self.enable_notifications = enable_notifications
        self.enable_sentiment = enable_sentiment
        
        # Initialize session with authentication headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'OK-ACCESS-KEY': OKX_API_KEY,
            'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE
        })
        
        logger.info("OKX P2P Client initialized")
    
    def _sign_request(self, timestamp: str, method: str, request_path: str, body: str = '') -> str:
        """Generate signature for API request"""
        if not all([OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE]):
            logger.warning("Missing API credentials")
            return ''
            
        message = timestamp + method.upper() + request_path + body
        mac = hmac.new(
            bytes(OKX_SECRET_KEY, encoding='utf8'),
            bytes(message, encoding='utf-8'),
            digestmod='sha256'
        )
        return base64.b64encode(mac.digest()).decode()
    
    def _make_request(self, endpoint: str, method: str = 'GET', params: dict = None, data: dict = None) -> dict:
        """Make authenticated API request"""
        try:
            timestamp = datetime.utcnow().isoformat()[:-3] + 'Z'
            request_path = f"/api/v5/p2p/{endpoint}"
            
            # Generate signature
            body = ''
            if data:
                body = json.dumps(data)
            signature = self._sign_request(timestamp, method, request_path, body)
            
            # Update headers with signature
            self.session.headers.update({
                'OK-ACCESS-SIGN': signature,
                'OK-ACCESS-TIMESTAMP': timestamp
            })
            
            # Make request
            if method.upper() == 'GET':
                response = self.session.get(f"{self.base_url}{request_path}", params=params)
            else:
                response = self.session.post(f"{self.base_url}{request_path}", json=data)
            
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            return {}
    
    def get_supported_cryptocurrencies(self, fiat: str) -> Set[str]:
        """Get supported cryptocurrencies for a given fiat currency"""
        try:
            response = self.session.get(
                f"{self.api_base}/tradingPairs",
                params={'quoteCurrency': fiat}
            )
            response.raise_for_status()
            data = response.json()
            
            if data['code'] == '0':
                supported = {pair['baseCurrency'] for pair in data['data']}
                logger.info(f"Found {len(supported)} supported cryptocurrencies for {fiat}")
                return supported
            else:
                logger.error(f"Error getting supported pairs: {data['msg']}")
                return set()
                
        except Exception as e:
            logger.error(f"Error fetching supported cryptocurrencies: {str(e)}")
            return set()
    
    def get_p2p_prices(
        self,
        fiat: str,
        crypto: str,
        trade_type: str = "BUY",
        payment_methods: Optional[List[str]] = None,
        merchant_check: bool = True,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        min_24h_volume: Optional[float] = None,
        max_price_deviation: Optional[float] = None
    ) -> List[P2POffer]:
        """Get P2P offers based on specified criteria"""
        try:
            params = {
                'quoteCurrency': fiat,
                'baseCurrency': crypto,
                'side': trade_type.upper(),
                'paymentMethod': ','.join(payment_methods) if payment_methods else None,
                'userType': 'merchant' if merchant_check else None,
                'minSingleTransAmount': min_amount,
                'maxSingleTransAmount': max_amount
            }
            
            # Remove None values
            params = {k: v for k, v in params.items() if v is not None}
            
            response = self.session.get(
                f"{self.api_base}/advertisements",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            if data['code'] != '0':
                logger.error(f"Error getting P2P prices: {data['msg']}")
                return []
            
            offers = []
            for offer_data in data['data']:
                try:
                    # Calculate risk score based on available metrics
                    risk_score = self._calculate_risk_score(offer_data)
                    
                    payment_methods_list = [
                        PaymentMethod(
                            name=pm['name'],
                            identifier=pm['identifier']
                        ) for pm in offer_data.get('paymentMethods', [])
                    ]
                    
                    offer = P2POffer(
                        advertiser=offer_data['nickName'],
                        price=float(offer_data['price']),
                        available_amount=float(offer_data['availableAmount']),
                        min_amount=float(offer_data.get('minSingleTransAmount', 0)),
                        max_amount=float(offer_data.get('maxSingleTransAmount', 0)),
                        payment_methods=payment_methods_list,
                        crypto=crypto,
                        fiat=fiat,
                        trade_type=trade_type,
                        merchant_risk=MerchantRisk(
                            risk_score=risk_score,
                            risk_level=self._get_risk_level(risk_score)
                        ),
                        month_order_count=int(offer_data.get('completedOrdersCount30d', 0)),
                        month_finish_rate=float(offer_data.get('completionRate30d', 0)),
                        positive_rate=float(offer_data.get('positiveRate', 0)),
                        user_type=offer_data.get('userType', 'user'),
                        user_grade=int(offer_data.get('userGrade', 0)),
                        user_identity=offer_data.get('userIdentity', ''),
                        badges=offer_data.get('badges', []),
                        vip_level=int(offer_data['vipLevel']) if offer_data.get('vipLevel') else None,
                        active_time_in_second=int(offer_data.get('activeTimeInSecond', 0)),
                        volume_24h=float(offer_data.get('volume24h', 0)),
                        price_deviation=float(offer_data.get('priceDeviation', 0))
                    )
                    
                    # Apply filters if specified
                    if (min_24h_volume is None or offer.volume_24h >= min_24h_volume) and \
                       (max_price_deviation is None or abs(offer.price_deviation) <= max_price_deviation):
                        offers.append(offer)
                        
                except Exception as e:
                    logger.warning(f"Error processing offer: {str(e)}")
                    logger.info(f"Advertiser data fields: {offer_data}")
                    continue
            
            return offers
            
        except Exception as e:
            logger.error(f"Error fetching P2P prices: {str(e)}")
            return []
    
    def _calculate_risk_score(self, offer_data: Dict) -> float:
        """Calculate risk score based on merchant metrics"""
        try:
            # Base score starts at 50
            score = 50.0
            
            # Adjust based on completion rate
            completion_rate = float(offer_data.get('completionRate30d', 0))
            score += completion_rate * 20  # Up to 20 points
            
            # Adjust based on positive rate
            positive_rate = float(offer_data.get('positiveRate', 0))
            score += positive_rate * 15  # Up to 15 points
            
            # Adjust based on order count
            order_count = int(offer_data.get('completedOrdersCount30d', 0))
            score += min(order_count / 100, 1.0) * 10  # Up to 10 points
            
            # Adjust based on user grade
            user_grade = int(offer_data.get('userGrade', 0))
            score += user_grade * 2  # Up to ~6 points
            
            # Penalize if not a merchant
            if offer_data.get('userType') != 'merchant':
                score -= 5
            
            # Ensure score is between 0 and 100
            return max(0.0, min(100.0, score))
            
        except Exception as e:
            logger.error(f"Error calculating risk score: {str(e)}")
            return 50.0  # Return medium risk score on error
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to risk level"""
        if risk_score >= 80:
            return "LOW"
        elif risk_score >= 60:
            return "MEDIUM"
        else:
            return "HIGH"
    
    def get_historical_prices(
        self,
        fiat: str,
        crypto: str,
        days: int = 1
    ) -> List[Dict]:
        """Get historical price data for a trading pair"""
        if not self.enable_historical:
            logger.warning("Historical data collection is disabled")
            return []
            
        try:
            # Calculate timestamps
            end_time = int(time.time())
            start_time = end_time - (days * 24 * 60 * 60)
            
            params = {
                'quoteCurrency': fiat,
                'baseCurrency': crypto,
                'startTime': start_time * 1000,  # Convert to milliseconds
                'endTime': end_time * 1000
            }
            
            response = self.session.get(
                f"{self.api_base}/publicTrades",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            if data['code'] != '0':
                logger.error(f"Error getting historical prices: {data['msg']}")
                return []
            
            history = []
            for trade in data['data']:
                try:
                    history.append({
                        'timestamp': datetime.fromtimestamp(int(trade['timestamp']) / 1000),
                        'price': float(trade['price']),
                        'amount': float(trade['amount']),
                        'volume': float(trade['price']) * float(trade['amount']),
                        'trade_type': trade['side']
                    })
                except Exception as e:
                    logger.warning(f"Error processing historical trade: {str(e)}")
                    continue
            
            # Store in historical data
            pair_key = f"{crypto}/{fiat}"
            self.historical_data[pair_key] = history
            
            return history
            
        except Exception as e:
            logger.error(f"Error fetching historical prices: {str(e)}")
            return []
    
    def get_merchant_info(self, merchant_id: str) -> Optional[Dict]:
        """Get detailed information about a merchant"""
        try:
            response = self.session.get(
                f"{self.api_base}/userInfo",
                params={'userID': merchant_id}
            )
            response.raise_for_status()
            data = response.json()
            
            if data['code'] != '0':
                logger.error(f"Error getting merchant info: {data['msg']}")
                return None
            
            merchant_data = data['data']
            return {
                'nickname': merchant_data.get('nickName', ''),
                'user_type': merchant_data.get('userType', 'user'),
                'user_grade': int(merchant_data.get('userGrade', 0)),
                'user_identity': merchant_data.get('userIdentity', ''),
                'month_order_count': int(merchant_data.get('completedOrdersCount30d', 0)),
                'month_finish_rate': float(merchant_data.get('completionRate30d', 0)),
                'positive_rate': float(merchant_data.get('positiveRate', 0)),
                'badges': merchant_data.get('badges', []),
                'vip_level': int(merchant_data['vipLevel']) if merchant_data.get('vipLevel') else None,
                'active_time': int(merchant_data.get('activeTimeInSecond', 0)),
                'volume_24h': float(merchant_data.get('volume24h', 0)),
                'supported_payments': merchant_data.get('supportedPayments', []),
                'registration_date': datetime.fromtimestamp(
                    int(merchant_data['registrationTime']) / 1000
                ) if merchant_data.get('registrationTime') else None
            }
            
        except Exception as e:
            logger.error(f"Error fetching merchant info: {str(e)}")
            return None
    
    def analyze_market_sentiment(
        self,
        fiat: str,
        crypto: str
    ) -> Optional[Dict]:
        """Analyze market sentiment for a trading pair"""
        if not self.enable_sentiment:
            logger.warning("Sentiment analysis is disabled")
            return None
            
        try:
            # Get recent trades and orders
            recent_trades = self.get_historical_prices(fiat, crypto, days=1)
            buy_orders = self.get_p2p_prices(fiat, crypto, "BUY")
            sell_orders = self.get_p2p_prices(fiat, crypto, "SELL")
            
            if not recent_trades or not buy_orders or not sell_orders:
                return None
            
            # Calculate basic metrics
            avg_price = sum(t['price'] for t in recent_trades) / len(recent_trades)
            buy_volume = sum(t['volume'] for t in recent_trades if t['trade_type'] == 'BUY')
            sell_volume = sum(t['volume'] for t in recent_trades if t['trade_type'] == 'SELL')
            
            # Calculate price momentum
            price_changes = [
                (t['price'] - prev['price']) / prev['price']
                for prev, t in zip(recent_trades[:-1], recent_trades[1:])
            ]
            momentum = sum(price_changes) / len(price_changes) if price_changes else 0
            
            # Determine market trend
            if momentum > 0.01:
                trend = "BULLISH"
            elif momentum < -0.01:
                trend = "BEARISH"
            else:
                trend = "NEUTRAL"
            
            # Calculate volume trend
            volume_ratio = buy_volume / sell_volume if sell_volume > 0 else 1
            if volume_ratio > 1.1:
                volume_trend = "INCREASING"
            elif volume_ratio < 0.9:
                volume_trend = "DECREASING"
            else:
                volume_trend = "STABLE"
            
            # Calculate market activity
            total_orders = len(buy_orders) + len(sell_orders)
            if total_orders > 100:
                activity = "HIGH"
            elif total_orders > 50:
                activity = "MEDIUM"
            else:
                activity = "LOW"
            
            # Calculate sentiment score (-100 to 100)
            sentiment_score = (
                (momentum * 50) +  # Price momentum contribution
                ((volume_ratio - 1) * 30) +  # Volume ratio contribution
                (min(total_orders / 100, 1) * 20)  # Activity contribution
            )
            
            return {
                'sentiment_score': max(-100, min(100, sentiment_score)),
                'trend': trend,
                'volume_trend': volume_trend,
                'market_activity': activity,
                'price_momentum': momentum * 100,  # Convert to percentage
                'confidence': min(abs(sentiment_score), 100),
                'timestamp': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing market sentiment: {str(e)}")
            return None 