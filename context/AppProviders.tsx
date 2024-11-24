import React, { ReactNode } from 'react';
import { MoodProvider } from '../context/MoodContext';
import { HistoriesProvider } from './HistoriesContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <MoodProvider>
    <HistoriesProvider>
          {children}
    </HistoriesProvider>
    </MoodProvider>
  );
}; 