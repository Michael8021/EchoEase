export interface History {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  transcribed_text: string;
  userId: string;
}


// Define the target JSON structure using TypeScript interfaces
export interface Schedule {
  description: string;
  due_date: string;
  end_time: string;
  historyId: string;
  notify_at: string;
  start_time: string;
  status: 'pending' | 'completed';
  title: string;
  type: 'event' | 'reminder';
  userId: string;
  $id: string;
}

export interface Finance {
  transaction_type: 'expense' | 'income';
  amount: number;
  currency: string;
  category: string;
  date: string;
  description: string;
  userId: string;
  historyId: string;
}

export interface Mood {
  userId: string;
  datetime: string;
  mood_type: string;
  description: string;
  historyId: string | null;
}

export interface Other {
  title: string;
  description: string;
  datetime: string;
  userId: string;
  historyId: string;
}

export interface CategorizedData {
  schedule: Schedule[];
  finance: Finance[];
  mood: Mood[];
  other: Other[];
}