export interface ContentType {
  categories: Array<{
    type: 'schedule' | 'finance' | 'mood' | 'other';
  }>;
}

export interface Schedule {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  description: string;
  type: 'event' | 'reminder';
  status: 'pending' | 'completed';
  start_time: string;
  end_time?: string;
  notify_at?: string;
  historyId: string;
  userId: string;
  due_date?: string;
}

export interface History {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  transcribed_text: string;
  userId: string;
}