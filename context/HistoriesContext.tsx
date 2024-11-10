import React, { createContext, useState, ReactNode, useContext } from 'react';
import { History } from '../lib/types';

interface GroupedHistories {
  date: string;
  items: History[];
}

interface HistoriesContextProps {
  groupedHistories: GroupedHistories[];
  setGroupedHistories: (histories: GroupedHistories[]) => void;
  addHistory: (history: History) => void;
  updateHistoryItem: (updatedHistory: History) => void;
  removeHistory: (id: string) => void;
}

const HistoriesContext = createContext<HistoriesContextProps | undefined>(undefined);

export const HistoriesProvider = ({ children }: { children: ReactNode }) => {
  const [groupedHistories, setGroupedHistories] = useState<GroupedHistories[]>([]);

  const addHistory = (history: History) => {
    const date = new Date(history.$createdAt).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    setGroupedHistories(prev => {
    //   console.log('Previous state:', prev);
      const groupIndex = prev.findIndex(group => group.date === date);
      if (groupIndex !== -1) {
        const updatedGroup = {
          ...prev[groupIndex],
          items: [history, ...prev[groupIndex].items]
        };
        const newGrouped = [...prev];
        newGrouped[groupIndex] = updatedGroup;
        // console.log('Updated state with existing group:', newGrouped);
        return newGrouped;
      } else {
        const newState = [{ date, items: [history] }, ...prev];
        // console.log('Updated state with new group:', newState);
        return newState;
      }
    });
  };

  const updateHistoryItem = (updatedHistory: History) => {
    const date = new Date(updatedHistory.$createdAt).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    setGroupedHistories(prev => {
      return prev.map(group => {
        if (group.date === date) {
          return {
            ...group,
            items: group.items.map(item => item.$id === updatedHistory.$id ? updatedHistory : item)
          };
        }
        return group;
      });
    });
  };

  const removeHistory = (id: string) => {
    const updatedGroups = groupedHistories.map(group => ({
      ...group,
      items: group.items.filter(item => item.$id !== id)
    })).filter(group => group.items.length > 0);

    setGroupedHistories(updatedGroups);
  };

  return (
    <HistoriesContext.Provider value={{ 
      groupedHistories, 
      setGroupedHistories, 
      addHistory, 
      updateHistoryItem, 
      removeHistory 
    }}>
      {children}
    </HistoriesContext.Provider>
  );
};

export const useHistories = () => {
  const context = useContext(HistoriesContext);
  if (!context) {
    throw new Error('useHistories must be used within a HistoriesProvider');
  }
  return context;
};