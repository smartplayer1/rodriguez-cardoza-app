export interface Bank {
  id: number;
  name: string;
  acronymus: string
}

export interface BankAccount {
  id: number;
  accountNumber: string;
  description: string;
  bank: {
    id: number;
    name: string;
    acronymus: string;
  }
}

export interface AccountData {
  id: number; 
  bankId: number | null;
  account: string | null;
  description: string | null;
}
