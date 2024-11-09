export interface ScheduleResponse {
    title: string;
    description: string;
    date: string;
    time: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed';
  }