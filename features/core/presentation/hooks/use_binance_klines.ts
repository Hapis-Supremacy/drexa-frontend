import { useEffect, useState } from "react";
import { fetchKlines, TF_TO_INTERVAL, type Candle } from "@/lib/binance";

export type { Candle } from "@/lib/binance";

/**
 * Loads historical candlesticks for a symbol/timeframe and keeps the latest
 * candle updating in realtime via the Binance kline WebSocket.
 *
 * - The forming candle is updated in place (same open time).
 * - When a candle closes, a new one is appended and the window is trimmed to `limit`.
 */
export function useBinanceKlines(sym: string, tf: string, limit = 120) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = TF_TO_INTERVAL[tf] ?? "1h";
    let active = true;
    queueMicrotask(() => {
      setLoading(true);
      setCandles([]);
    });
    fetchKlines(sym, interval, limit)
      .then((data) => {
        if (active) {
          setCandles(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    // Removed WebSocket live updates as part of Binance migration.
    // Candlesticks will be fetched via REST once until the backend provides a kline stream.
    
    return () => {
      active = false;
    };
  }, [sym, tf, limit]);

  return { candles, loading };
}
