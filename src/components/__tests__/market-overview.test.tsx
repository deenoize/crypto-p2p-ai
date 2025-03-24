import { render, screen } from '@testing-library/react';
import { MarketOverview } from '../market-overview';

describe('MarketOverview', () => {
  it('renders market overview component', () => {
    render(<MarketOverview />);
    expect(screen.getByText('Market Overview')).toBeInTheDocument();
    expect(screen.getByText('Price Trends')).toBeInTheDocument();
    expect(screen.getByText('Volume Analysis')).toBeInTheDocument();
  });
}); 