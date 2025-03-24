import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceAlerts } from '../price-alerts';

interface PriceAlert {
  id: string;
  crypto?: string;
  fiat?: string;
  condition: "ABOVE" | "BELOW";
  price: number;
  paymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  active: boolean;
}

describe('PriceAlerts', () => {
  const mockAlerts: PriceAlert[] = [
    {
      id: '1',
      price: 45000,
      condition: "ABOVE",
      active: true
    }
  ];

  it('renders alerts correctly', () => {
    render(<PriceAlerts alerts={mockAlerts} />);
    const priceText = screen.getByText((content) => {
      return content.includes('45,000') && content.includes('above');
    });
    expect(priceText).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('handles empty alerts', () => {
    render(<PriceAlerts alerts={[]} />);
    expect(screen.getByText('No active alerts')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PriceAlerts alerts={[]} loading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load alerts';
    render(<PriceAlerts alerts={[]} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles alert toggle', () => {
    const onToggleAlert = jest.fn();
    render(<PriceAlerts alerts={mockAlerts} onToggleAlert={onToggleAlert} />);
    const toggleButton = screen.getByRole('button', { name: /deactivate/i });
    fireEvent.click(toggleButton);
    expect(onToggleAlert).toHaveBeenCalledWith('1');
  });

  it('handles alert deletion', () => {
    const onDeleteAlert = jest.fn();
    render(<PriceAlerts alerts={mockAlerts} onDeleteAlert={onDeleteAlert} />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    expect(onDeleteAlert).toHaveBeenCalledWith('1');
  });

  it('allows creating new alerts', async () => {
    const onAddAlert = jest.fn();
    render(<PriceAlerts alerts={mockAlerts} onAddAlert={onAddAlert} />);

    const priceInput = screen.getByLabelText(/price/i);
    const conditionSelect = screen.getByLabelText(/condition/i);
    const openDialogButton = screen.getByText('Create Alert');
    
    fireEvent.click(openDialogButton);
    
    const submitButton = screen.getByTestId('submit-alert');

    await userEvent.type(priceInput, '31000');
    await userEvent.selectOptions(conditionSelect, 'ABOVE');
    fireEvent.click(submitButton);

    expect(onAddAlert).toHaveBeenCalledWith({
      price: 31000,
      condition: "ABOVE",
      active: true
    });
  });

  it('validates price input', async () => {
    render(<PriceAlerts alerts={mockAlerts} />);

    const openDialogButton = screen.getByText('Create Alert');
    fireEvent.click(openDialogButton);

    const priceInput = screen.getByLabelText(/price/i);
    const submitButton = screen.getByTestId('submit-alert');

    await userEvent.type(priceInput, 'invalid');
    fireEvent.click(submitButton);

    expect(screen.getByText(/please enter a valid price/i)).toBeInTheDocument();
  });
}); 