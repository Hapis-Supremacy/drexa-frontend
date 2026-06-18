import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface LedgerBalance {
  walletId: string;
  currency: string;
  balance: number;   // smallest unit (satoshi / wei / cents)
  locked: number;
  available: number;
  status: string;
}

type BalanceResponse = {
  wallet_id: string;
  currency: string;
  balance: number;
  locked: number;
  available: number;
  status: string;
};

/** Decimals to convert a currency's smallest unit to its main unit. */
export const CURRENCY_DECIMALS: Record<string, number> = {
  BTC: 8, ETH: 18, USD: 2, USDC: 2, USDT: 2, IDR: 0,
};

export function toMainUnit(currency: string, smallest: number): number {
  const d = CURRENCY_DECIMALS[currency] ?? 2;
  return smallest / 10 ** d;
}

/** Fetches the user's real ledger balances from the gateway (`GET /wallet/balances`). */
export function useLedgerBalances() {
  const [balances, setBalances] = useState<Record<string, LedgerBalance>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<BalanceResponse[]>("/wallet/balances");
      const map: Record<string, LedgerBalance> = {};
      for (const b of data ?? []) {
        map[b.currency] = {
          walletId: b.wallet_id,
          currency: b.currency,
          balance: b.balance,
          locked: b.locked,
          available: b.available,
          status: b.status,
        };
      }
      setBalances(map);
    } catch {
      setBalances({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  return { balances, loading, refresh };
}
