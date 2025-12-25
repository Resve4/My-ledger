
export type AccountType = 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';

export interface Transaction {
  id: string;
  date: string;
  particulars: string;
  debit: number;
  credit: number;
  party: string;
  accountType: AccountType;
}

export interface LedgerEntry extends Transaction {
  balance: number;
  balanceType: 'Dr' | 'Cr';
}

export interface AccountLedger {
  accountName: string;
  entries: LedgerEntry[];
  openingBalance: number;
  closingBalance: number;
  closingBalanceType: 'Dr' | 'Cr';
  totalDebit: number;
  totalCredit: number;
}
