import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MoodContextProps {
  refreshMoods: () => void;
}

const MoodContext = createContext<MoodContextProps | undefined>(undefined);

export const MoodProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshMoods = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <MoodContext.Provider value={{ refreshMoods }}>
      {children}
    </MoodContext.Provider>
  );
};

export const useMoodContext = () => {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMoodContext must be used within a MoodProvider');
  }
  return context;
};