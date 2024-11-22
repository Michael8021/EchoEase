import React, { ReactNode } from 'react';
import { HistoriesProvider } from './HistoriesContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <HistoriesProvider>
          {children}
    </HistoriesProvider>
  );
}; 