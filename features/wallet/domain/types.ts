export type WalletTab = 'overview' | 'deposit' | 'withdraw';

export type WalletTransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'fee'
  | 'reversal';

export type WalletTransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'reversed';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  status: WalletTransactionStatus;
  createdAt: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}
