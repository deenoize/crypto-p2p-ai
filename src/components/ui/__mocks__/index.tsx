import React from 'react';

// Mock UI components for testing
export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;

export const Button: React.FC<{ children: React.ReactNode }> = ({ children }) => <button>{children}</button>;

export const Dialog: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const DialogTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;

export const Select: React.FC<{ children: React.ReactNode }> = ({ children }) => <select>{children}</select>;
export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const SelectItem: React.FC<{ children: React.ReactNode; value: string }> = ({ children, value }) => (
  <option value={value}>{children}</option>
);
export const SelectTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const SelectValue: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;

export const Alert: React.FC<{ children: React.ReactNode }> = ({ children }) => <div role="alert">{children}</div>;
export const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => <div>{children}</div>;

// Table components
export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => <table>{children}</table>;
export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <thead>{children}</thead>;
export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => <tbody>{children}</tbody>;
export const TableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => <tr>{children}</tr>;
export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => <th>{children}</th>;
export const TableCell: React.FC<{ children: React.ReactNode; colSpan?: number }> = ({ children, colSpan }) => (
  <td colSpan={colSpan}>{children}</td>
); 