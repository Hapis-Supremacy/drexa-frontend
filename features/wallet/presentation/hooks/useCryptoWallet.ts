import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface CryptoAsset {
  currency: string;
  chain: string;
  network: string;
  address: string;
  balance: string; // decimal string in the coin's main unit
}

/** Currencies the Tatum-backed gateway serves real on-chain addresses for. */
export const CRYPTO_SUPPORTED = ["BTC", "ETH"] as const;

export function isCryptoSupported(currency: string): boolean {
  return (CRYPTO_SUPPORTED as readonly string[]).includes(currency);
}

/**
 * Fetches (and lazily provisions) the user's on-chain deposit address + live
 * balance for a currency from the gateway (`GET /wallet/crypto/address/{cur}`).
 */
export function useCryptoAddress(currency: string, enabled = true) {
  const [data, setData] = useState<CryptoAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isCryptoSupported(currency)) {
      queueMicrotask(() => {
        setData(null);
        setError(null);
        setLoading(false);
      });
      return;
    }

    let active = true;
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    api
      .get<CryptoAsset>(`/wallet/crypto/address/${currency}`)
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : "Failed to load deposit address");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currency, enabled]);

  return { data, loading, error };
}
