import React from 'react';
import { render, screen } from '@testing-library/react';
import { TradingStrategies } from '../trading-strategies';

describe('TradingStrategies', () => {
  const mockStrategies = [
    {
      id: '1',
      name: 'Momentum Trading',
      description: 'Follow market trends',
      risk: 'medium',
      potentialReturn: 'high',
      timeFrame: 'short',
      requirements: ['Technical Analysis', 'Market Knowledge'],
      currentSignal: 'BUY',
      confidence: 85
    }
  ];

  it('renders strategies correctly', () => {
    render(<TradingStrategies strategies={mockStrategies} />);
    expect(screen.getByText('Momentum Trading')).toBeInTheDocument();
    expect(screen.getByText('BUY')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('handles empty strategies', () => {
    render(<TradingStrategies strategies={[]} />);
    expect(screen.getByText('No strategies available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TradingStrategies strategies={[]} loading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load strategies';
    render(<TradingStrategies strategies={[]} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('filters strategies by risk level', () => {
    render(<TradingStrategies strategies={mockStrategies} selectedRisk="medium" />);
    expect(screen.getByText('Momentum Trading')).toBeInTheDocument();
  });

  it('sorts strategies by confidence', () => {
    render(<TradingStrategies strategies={mockStrategies} sortBy="confidence" />);
    expect(screen.getByText('Momentum Trading')).toBeInTheDocument();
  });
}); 