"""
Configuration management for the OpenAI Operator
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Binance Configuration
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_SECRET_KEY = os.getenv("BINANCE_SECRET_KEY")

# OKX Configuration
OKX_API_KEY = os.getenv("OKX_API_KEY")
OKX_SECRET_KEY = os.getenv("OKX_SECRET_KEY")
OKX_PASSPHRASE = os.getenv("OKX_PASSPHRASE")

# Application Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Validate required environment variables
def validate_config():
    """Validate that all required environment variables are set."""
    required_vars = [
        ("OPENAI_API_KEY", OPENAI_API_KEY),
        ("BINANCE_API_KEY", BINANCE_API_KEY),
        ("BINANCE_SECRET_KEY", BINANCE_SECRET_KEY),
        ("OKX_API_KEY", OKX_API_KEY),
        ("OKX_SECRET_KEY", OKX_SECRET_KEY),
        ("OKX_PASSPHRASE", OKX_PASSPHRASE),
    ]
    
    missing_vars = [var_name for var_name, var_value in required_vars if not var_value]
    
    if missing_vars:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing_vars)}\n"
            "Please check your .env file and ensure all required variables are set."
        ) 