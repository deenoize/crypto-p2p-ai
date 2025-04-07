import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderBook } from '../order-book';

const mockBuyOrders = [
  {
    id: 'buy123',
    advNo: 'buy123',
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
      lastOnlineTime: Date.now() / 1000 - 300,
      userType: 'user',
      userIdentity: 'user1'
    }
  }
];

const mockSellOrders = [
  {
    id: 'sell456',
    advNo: 'sell456',
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
      lastOnlineTime: Date.now() / 1000 - 7200,
      userType: 'user',
      userIdentity: 'user2'
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

    // Check sell order details
    expect(screen.getByText('$30,100')).toBeInTheDocument();
    expect(screen.getByText('0.5 BTC')).toBeInTheDocument();
    expect(screen.getByText('Wise')).toBeInTheDocument();
    expect(screen.getByText('SEPA')).toBeInTheDocument();
    expect(screen.getByText('TestMerchant2')).toBeInTheDocument();
    expect(screen.getByText('92.0%')).toBeInTheDocument();
    expect(screen.getByText('95.0% completion')).toBeInTheDocument();
    expect(screen.getByText('150 trades')).toBeInTheDocument();
  });

  it('handles order selection correctly', () => {
    const onOrderSelectMock = jest.fn();
    render(
      <OrderBook
        fiat="USD"
        crypto="BTC"
        buyOrders={mockBuyOrders}
        sellOrders={mockSellOrders}
        onOrderSelect={onOrderSelectMock}
      />
    );

    // Find and click buy order
    const buyOrderRow = screen.getByText('TestMerchant1').closest('tr');
    if (buyOrderRow) {
      fireEvent.click(buyOrderRow);
      expect(onOrderSelectMock).toHaveBeenCalledWith('BUY', mockBuyOrders[0]);
    }

    // Find and click sell order
    const sellOrderRow = screen.getByText('TestMerchant2').closest('tr');
    if (sellOrderRow) {
      fireEvent.click(sellOrderRow);
      expect(onOrderSelectMock).toHaveBeenCalledWith('SELL', mockSellOrders[0]);
    }
  });

  it('highlights selected orders correctly', () => {
    render(
      <OrderBook
        fiat="USD"
        crypto="BTC"
        buyOrders={mockBuyOrders}
        sellOrders={mockSellOrders}
        selectedBuyOrder={mockBuyOrders[0]}
        selectedSellOrder={mockSellOrders[0]}
      />
    );

    // Check if buy order is highlighted
    const buyOrderRow = screen.getByText('TestMerchant1').closest('tr');
    if (buyOrderRow) {
      expect(buyOrderRow).toHaveClass('bg-blue-50');
    }

    // Check if sell order is highlighted
    const sellOrderRow = screen.getByText('TestMerchant2').closest('tr');
    if (sellOrderRow) {
      expect(sellOrderRow).toHaveClass('bg-blue-50');
    }
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

  it('handles order deselection correctly', () => {
    const onOrderSelectMock = jest.fn();
    render(
      <OrderBook
        fiat="USD"
        crypto="BTC"
        buyOrders={mockBuyOrders}
        sellOrders={mockSellOrders}
        onOrderSelect={onOrderSelectMock}
        selectedBuyOrder={mockBuyOrders[0]}
        selectedSellOrder={mockSellOrders[0]}
      />
    );

    // Click selected buy order again to deselect
    const buyOrderRow = screen.getByText('TestMerchant1').closest('tr');
    if (buyOrderRow) {
      fireEvent.click(buyOrderRow);
      expect(onOrderSelectMock).toHaveBeenCalledWith('BUY', null);
    }

    // Click selected sell order again to deselect
    const sellOrderRow = screen.getByText('TestMerchant2').closest('tr');
    if (sellOrderRow) {
      fireEvent.click(sellOrderRow);
      expect(onOrderSelectMock).toHaveBeenCalledWith('SELL', null);
    }
  });
}); 