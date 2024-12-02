export interface ExpenseItem {
    id:string;
    category: string;
    amount:string;
    color:string;
  }

  export interface IncomeItem {
    id: number;
    name: string;
    amount: string;
  }

  export interface SpendingItem {
    id:string;
    name: string;
    amount: string;
    date: string;
    category:string;
    historyId: String;
  }

  export interface AIFinanceData {
    description: string;
    amount: number | string;
    date: string;
    category: string;
    create_type?: boolean;
    historyId?: string;
  }
