import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrderBook } from '../order-book';

const mockBuyOrders = [
  {
    price: 30000,
    amount: 1.5,
    minAmount: 100,
    maxAmount: 1000,
    paymentMethods: ['Bank Transfer', 'PayPal'],
    merchant: {
      name: 'TestMerchant1',
      rating: 98,
      completedTrades: 550,
      completionRate: 99.5,
      lastOnlineTime: Date.now() / 1000 - 300, // 5 minutes ago
      userType: 'user',
      userIdentity: ''
    }
  }
];

const mockSellOrders = [
  {
    price: 30100,
    amount: 0.5,
    minAmount: 50,
    maxAmount: 500,
    paymentMethods: ['Wise', 'SEPA'],
    merchant: {
      name: 'TestMerchant2',
      rating: 92,
      completedTrades: 150,
      completionRate: 95.0,
      lastOnlineTime: Date.now() / 1000 - 7200, // 2 hours ago
      userType: 'user',
      userIdentity: ''
    }
  }
];

describe('OrderBook Component', () => {
  it('renders loading state correctly', () => {
    render(<OrderBook fiat="USD" crypto="BTC" loading={true} />);
    expect(screen.getByText('Order Book')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('animate-spin');
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to fetch orders';
    render(<OrderBook fiat="USD" crypto="BTC" error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('text-red-500');
  });

  it('renders empty state correctly', () => {
    render(<OrderBook fiat="USD" crypto="BTC" />);
    expect(screen.getAllByText('No orders available')).toHaveLength(2);
  });

  it('renders buy and sell orders correctly', () => {
    render(
      <OrderBook
        fiat="USD"
        crypto="BTC"
        buyOrders={mockBuyOrders}
        sellOrders={mockSellOrders}
      />
    );

    // Check headers
    expect(screen.getByText('Buy Orders')).toBeInTheDocument();
    expect(screen.getByText('Sell Orders')).toBeInTheDocument();

    // Check buy order details
    expect(screen.getByText('$30,000')).toBeInTheDocument();
    expect(screen.getByText('1.5 BTC')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
    expect(screen.getByText('TestMerchant1')).toBeInTheDocument();
    expect(screen.getByText('98.0%')).toBeInTheDocument();
    expect(screen.getByText('99.5% completion')).toBeInTheDocument();
    expect(screen.getByText('550 trades')).toBeInTheDocument();
    expect(screen.getByText('Elite Trader')).toBeInTheDocument();

    // Check sell order details
    expect(screen.getByText('$30,100')).toBeInTheDocument();
    expect(screen.getByText('0.5 BTC')).toBeInTheDocument();
    expect(screen.getByText('Wise')).toBeInTheDocument();
    expect(screen.getByText('SEPA')).toBeInTheDocument();
    expect(screen.getByText('TestMerchant2')).toBeInTheDocument();
    expect(screen.getByText('92.0%')).toBeInTheDocument();
    expect(screen.getByText('95.0% completion')).toBeInTheDocument();
    expect(screen.getByText('150 trades')).toBeInTheDocument();
    expect(screen.getByText('Experienced')).toBeInTheDocument();
  });

  it('formats merchant type correctly based on metrics', () => {
    const orders = [{
      ...mockBuyOrders[0],
      merchant: {
        ...mockBuyOrders[0].merchant,
        completedTrades: 25,
        rating: 85,
        completionRate: 85
      }
    }];

    render(<OrderBook fiat="USD" crypto="BTC" buyOrders={orders} />);
    expect(screen.getByText('New Trader')).toBeInTheDocument();
  });

  it('formats last online time correctly', () => {
    const now = Date.now();
    const orders = [{
      ...mockBuyOrders[0],
      merchant: {
        ...mockBuyOrders[0].merchant,
        lastOnlineTime: now / 1000 - 30 // 30 seconds ago
      }
    }];

    render(<OrderBook fiat="USD" crypto="BTC" buyOrders={orders} />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('applies correct color classes for payment methods', () => {
    render(
      <OrderBook
        fiat="USD"
        crypto="BTC"
        buyOrders={mockBuyOrders}
        sellOrders={mockSellOrders}
      />
    );

    const paymentMethods = screen.getAllByText(/Bank Transfer|PayPal|Wise|SEPA/);
    paymentMethods.forEach(method => {
      expect(method).toHaveClass('rounded', 'px-1', 'text-[9px]', 'leading-[14px]');
      expect(method.className).toMatch(/bg-.*-500\/15/);
      expect(method.className).toMatch(/text-.*-700/);
    });
  });

  it('handles different currency symbols correctly', () => {
    render(
      <OrderBook
        fiat="EUR"
        crypto="BTC"
        buyOrders={[{
          ...mockBuyOrders[0],
          price: 28000
        }]}
      />
    );

    expect(screen.getByText('€28,000')).toBeInTheDocument();
  });
}); 