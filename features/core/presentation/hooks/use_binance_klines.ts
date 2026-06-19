import { useEffect, useState } from "react";
import { fetchKlines, subscribeKline, TF_TO_INTERVAL, type Candle } from "@/lib/binance";

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
    let unsubscribe: (() => void) | undefined;

    setLoading(true);
    setCandles([]);

    fetchKlines(sym, interval, limit)
      .then((initialData) => {
        if (!active) return;
        setCandles(initialData);
        setLoading(false);

        // Start WebSocket live updates after the initial REST fetch completes
        unsubscribe = subscribeKline(sym, interval, (newCandle, closed) => {
          if (!active) return;
          setCandles((prev) => {
            const arr = [...prev];
            if (arr.length === 0) return [newCandle];
            
            const last = arr[arr.length - 1];
            if (newCandle.t === last.t) {
              // Update the current forming candle in place
              arr[arr.length - 1] = newCandle;
            } else if (newCandle.t > last.t) {
              // A new candle has started, append it and trim the array
              arr.push(newCandle);
              if (arr.length > limit) arr.shift();
            }
            return arr;
          });
        });
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, [sym, tf, limit]);

  return { candles, loading };
}
