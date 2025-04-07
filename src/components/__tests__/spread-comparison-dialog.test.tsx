import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpreadComparisonDialog } from '../spread-comparison-dialog';

const mockBuyOrder = {
  adv: {
    advNo: 'buy123',
    price: '1.001',
    surplusAmount: '3702.41',
    minSingleTransAmount: '100',
    maxSingleTransAmount: '9999',
    payMethods: ['Bank Transfer'],
    tradeMethods: ['Bank Transfer'],
    tradeType: 'BUY',
    asset: 'USDT',
    fiatUnit: 'USD'
  },
  advertiser: {
    nickName: 'BuyerMerchant',
    monthOrderCount: 832,
    monthFinishRate: 95,
    positiveRate: 98,
    userType: 'common'
  }
};

const mockSellOrder = {
  adv: {
    advNo: 'sell456',
    price: '1.266',
    surplusAmount: '120.00',
    minSingleTransAmount: '100',
    maxSingleTransAmount: '9999',
    payMethods: ['WebMoney'],
    tradeMethods: ['WebMoney'],
    tradeType: 'SELL',
    asset: 'USDT',
    fiatUnit: 'USD'
  },
  advertiser: {
    nickName: 'SellerMerchant',
    monthOrderCount: 4411,
    monthFinishRate: 95,
    positiveRate: 98,
    userType: 'all'
  }
};

describe('SpreadComparisonDialog Component', () => {
  it('renders correctly with buy and sell orders', () => {
    render(
      <SpreadComparisonDialog
        isOpen={true}
        onClose={() => {}}
        buyOrder={mockBuyOrder}
        sellOrder={mockSellOrder}
        fiat="USD"
      />
    );

    // Check merchant names
    expect(screen.getByText('BuyerMerchant')).toBeInTheDocument();
    expect(screen.getByText('SellerMerchant')).toBeInTheDocument();

    // Check prices
    expect(screen.getByText('$1.001')).toBeInTheDocument();
    expect(screen.getByText('$1.266')).toBeInTheDocument();

    // Check spread calculation
    const spreadPercentage = ((1.266 - 1.001) / 1.001 * 100).toFixed(2);
    expect(screen.getByText(`${spreadPercentage}%`)).toBeInTheDocument();
  });

  it('calculates profit correctly for different amounts', () => {
    render(
      <SpreadComparisonDialog
        isOpen={true}
        onClose={() => {}}
        buyOrder={mockBuyOrder}
        sellOrder={mockSellOrder}
        fiat="USD"
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000' } });

    // Calculate expected profit
    const buyPrice = 1.001;
    const sellPrice = 1.266;
    const amount = 1000;
    const profit = ((sellPrice - buyPrice) * amount).toFixed(2);

    expect(screen.getByText(`$${profit}`)).toBeInTheDocument();
  });

  it('validates input amount against order limits', () => {
    render(
      <SpreadComparisonDialog
        isOpen={true}
        onClose={() => {}}
        buyOrder={mockBuyOrder}
        sellOrder={mockSellOrder}
        fiat="USD"
      />
    );

    const input = screen.getByRole('spinbutton');

    // Test amount below minimum
    fireEvent.change(input, { target: { value: '50' } });
    expect(screen.getByText(/Amount must be at least/)).toBeInTheDocument();

    // Test amount above maximum
    fireEvent.change(input, { target: { value: '10000' } });
    expect(screen.getByText(/Amount cannot exceed/)).toBeInTheDocument();

    // Test valid amount
    fireEvent.change(input, { target: { value: '1000' } });
    expect(screen.queryByText(/Amount must be at least/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Amount cannot exceed/)).not.toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onCloseMock = jest.fn();
    render(
      <SpreadComparisonDialog
        isOpen={true}
        onClose={onCloseMock}
        buyOrder={mockBuyOrder}
        sellOrder={mockSellOrder}
        fiat="USD"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('displays not visible when isOpen is false', () => {
    const { container } = render(
      <SpreadComparisonDialog
        isOpen={false}
        onClose={() => {}}
        buyOrder={mockBuyOrder}
        sellOrder={mockSellOrder}
        fiat="USD"
      />
    );

    expect(container.firstChild).toBeNull();
  });
}); 