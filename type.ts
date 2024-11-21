export interface ExpenseItem {
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
    name: string;
    amount: string;
    date: string;
    category:string;
  }

  export interface PickerItem {
    label: string;
    value: string;
    color: string;
  };
