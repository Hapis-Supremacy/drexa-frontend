import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** One aggregated price level returned by the Go gateway. */
export interface OrderBookLevel {
  price: number;
  quantity: number;
}

/** Depth snapshot from GET /market/orderbook/{pairId}. */
export interface OrderBookSnapshot {
  pair_id: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

/**
 * Polls the backend order-book REST snapshot for a pair.
 *
 * The endpoint is a point-in-time snapshot of the in-memory matching engine,
 * so we re-fetch on an interval rather than stream. Errors (e.g. a pair the
 * backend doesn't know yet → 404) are swallowed and surfaced via `error`; the
 * caller can fall back to its own rendering when no live book is available.
 */
export function useOrderBook(pairId: string, depth = 12, intervalMs = 2000) {
  const [book, setBook] = useState<OrderBookSnapshot | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const data = await api.get<OrderBookSnapshot>(
          `/market/orderbook/${encodeURIComponent(pairId)}?depth=${depth}`,
        );
        if (!active) return;
        setBook(data);
        setError(null);
      } catch (e) {
        if (!active) return;
        setBook(null);
        setError(e instanceof Error ? e : new Error("order book fetch failed"));
      } finally {
        if (active) timer = setTimeout(poll, intervalMs);
      }
    };

    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [pairId, depth, intervalMs]);

  return { book, error };
}
