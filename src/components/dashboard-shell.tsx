import React from 'react';

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-4 bg-background">
        {children}
      </div>
    </div>
  )
} 