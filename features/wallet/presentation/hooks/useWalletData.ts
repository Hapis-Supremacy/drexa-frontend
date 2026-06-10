import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WalletBalance, WalletTransaction, WalletTransactionStatus, WalletTransactionType } from '@/features/wallet/domain/types';
import { api } from '@/lib/api';

type WalletTransactionResponse = {
  tx_id?: string;
  TxID?: string;
  type?: string;
  Type?: string;
  status?: string;
  Status?: string;
  amount?: number;
  Amount?: number;
  currency?: string;
  Currency?: string;
  created_at?: string;
  CreatedAt?: string;
};

const DEFAULT_CURRENCY = 'usd';

function normalizeTransaction(tx: WalletTransactionResponse): WalletTransaction {
  return {
    id: tx.tx_id ?? tx.TxID ?? crypto.randomUUID(),
    type: (tx.type ?? tx.Type ?? 'deposit') as WalletTransactionType,
    status: (tx.status ?? tx.Status ?? 'pending') as WalletTransactionStatus,
    amount: tx.amount ?? tx.Amount ?? 0,
    currency: tx.currency ?? tx.Currency ?? DEFAULT_CURRENCY.toUpperCase(),
    createdAt: tx.created_at ?? tx.CreatedAt ?? new Date().toISOString(),
  };
}

export function useWalletData(transactionLimit = 20) {
  const [walletBalanceCents, setWalletBalanceCents] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await api.get<WalletBalance>(`/wallet/balance/${DEFAULT_CURRENCY}`);
      setWalletBalanceCents(data.balance);
    } catch {
      setWalletBalanceCents(null);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const txns = await api.get<WalletTransactionResponse[]>(
        `/wallet/transactions?page=1&page_size=${transactionLimit}`
      );
      setTransactions((txns ?? []).map(normalizeTransaction));
    } catch {
      setTransactions([]);
    }
  }, [transactionLimit]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBalance();
      void fetchTransactions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchBalance, fetchTransactions]);

  const refresh = useCallback(() => {
    void fetchBalance();
    void fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  return useMemo(
    () => ({
      walletBalanceCents,
      walletUsd: walletBalanceCents !== null ? walletBalanceCents / 100 : null,
      transactions,
      refresh,
    }),
    [walletBalanceCents, transactions, refresh]
  );
}
