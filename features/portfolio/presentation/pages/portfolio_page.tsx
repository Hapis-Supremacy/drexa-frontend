"use client";

/* ── Drexa — Portfolio & Analytics ── */
import { CSSProperties, useState } from "react";
import { AppShell } from "@/features/core/presentation/components/app_shell";
import {
  Container, CoinBadge, Delta, DeltaPill, Donut, AreaChart,
  COIN, fNum, fCompact,
} from "@/features/core/presentation/components/drexa_kit";
import { useScrollReveal } from "@/features/core/presentation/hooks/use_scroll_reveal";

import { useLedgerBalances, toMainUnit } from "@/features/wallet/presentation/hooks/useLedgerBalances";
import { useMarketStream } from "@/features/core/presentation/hooks/use_market_stream";
import { useOrders } from "@/features/trade/presentation/hooks/useOrders";
import { useMemo } from "react";

// Fiat currencies excluded from crypto portfolio tracking
const FIAT = new Set(["IDR", "USD", "EUR", "GBP", "SGD"]);
const STABLECOIN = new Set(["USDT", "USDC", "DAI", "BUSD"]);

// Approximate IDR/USDT rate used to detect and convert IDR-denominated WebSocket prices.
// If the backend WebSocket sends BTC price in IDR (~1,040,000,000), this brings it back
// to ~65,000 USDT before being stored in portfolio value.
const IDR_PER_USDT = 16_000;

/** Normalize any incoming price to USDT denomination. */
function normalizeToUsdt(sym: string, wsPrice: number | undefined, mockPriceUsdt: number): number {
  if (STABLECOIN.has(sym)) return 1;
  if (!wsPrice || wsPrice <= 0) return mockPriceUsdt;
  // If wsPrice is more than 200× the CoinGecko/mock USD price, assume IDR denomination
  if (mockPriceUsdt > 0 && wsPrice > mockPriceUsdt * 200) return wsPrice / IDR_PER_USDT;
  return wsPrice;
}

/** Format a number as USDT. */
const fUSDT = (n: number, dp = 2) => fNum(n, dp) + " USDT";

const PF_COLOR: Record<string, string> = { BTC: "#F7931A", ETH: "#627EEA", SOL: "#9945FF", LINK: "#2A5ADA", USDC: "#2775CA" };

interface PfRow { sym: string; qty: number; avg: number; price: number; ch: number; value: number; cost: number; pnl: number; pnlPct: number; name: string; }
const PTF: [string, number, number][] = [["1W", 113, 0.05], ["1M", 131, 0.07], ["3M", 141, 0.09], ["1Y", 151, 0.12], ["All", 173, 0.16]];
const tdRm: CSSProperties = { textAlign: "right", padding: "14px 24px", font: "500 13.5px var(--mono)", color: "var(--text-2)", fontVariantNumeric: "tabular-nums" };

export function PortfolioPage() {
  useScrollReveal();
  const [tf, setTf] = useState("1M");
  
  const { balances, loading } = useLedgerBalances();
  const { getTicker } = useMarketStream();
  const { trades } = useOrders();

  const pf = useMemo(() => {
    const runningMap: Record<string, { qty: number; cost: number }> = {};
    const costCurve: number[] = [0];
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.executed_at).getTime() - new Date(b.executed_at).getTime());
    
    for (const t of sortedTrades) {
      const base = t.pair_id.split("_")[0];
      if (!runningMap[base]) runningMap[base] = { qty: 0, cost: 0 };
      
      if (t.side === "buy") {
        runningMap[base].qty += t.quantity;
        runningMap[base].cost += t.quantity * t.price;
      } else if (t.side === "sell") {
        if (runningMap[base].qty > 0) {
          const avgCost = runningMap[base].cost / runningMap[base].qty;
          runningMap[base].qty -= t.quantity;
          runningMap[base].cost -= t.quantity * avgCost;
        }
        if (runningMap[base].qty <= 0) {
          runningMap[base].qty = 0;
          runningMap[base].cost = 0;
        }
      }
      const totalInvested = Object.values(runningMap).reduce((acc, asset) => acc + asset.cost, 0);
      costCurve.push(totalInvested);
    }
    
    const costBasisMap: Record<string, number> = {};
    for (const base in runningMap) {
      costBasisMap[base] = runningMap[base].qty > 0 ? runningMap[base].cost / runningMap[base].qty : 0;
    }

    const rows: PfRow[] = Object.values(balances)
      .filter(b => b.balance > 0 && !FIAT.has(b.currency))
      .map(b => {
      const sym = b.currency;
      const qty = toMainUnit(sym, b.balance);
      const c = COIN(sym);
      const ticker = getTicker(sym);

      // CoinGecko mock price is the reliable USDT baseline (USD ≈ USDT)
      const mockPrice = c ? c.price : (STABLECOIN.has(sym) ? 1 : 0);
      // normalizeToUsdt guards against IDR-denominated WebSocket prices
      const price = normalizeToUsdt(sym, ticker?.price, mockPrice);
      const ch = ticker?.ch || (c ? c.ch : 0);

      let avg = costBasisMap[sym] || 0;
      if (avg === 0 && STABLECOIN.has(sym)) {
        avg = 1; // Stablecoins always cost 1 USDT — zero P&L
      }
      
      const cost = qty * avg;
      const value = qty * price;
      const pnl = cost > 0 ? value - cost : 0;
      
      return { 
        sym, qty, avg, price, ch, value, cost, pnl, 
        pnlPct: cost ? (pnl / cost) * 100 : 0, 
        name: c ? c.name : sym 
      };
    }).sort((a, b) => b.value - a.value);

    const value = rows.reduce((a, r) => a + r.value, 0);
    const cost = rows.reduce((a, r) => a + r.cost, 0);
    
    if (costCurve.length === 1) costCurve.push(0);
    costCurve.push(value); 
    
    return { rows, value, cost, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0, costCurve };
  }, [balances, getTicker, trades]);

  const curve = pf.costCurve;
  const periodReturn = pf.pnl;
  const periodPct = pf.pnlPct;
  const slices = pf.rows.map(r => ({ ...r, color: PF_COLOR[r.sym] || "#1E2B44", pct: pf.value > 0 ? (r.value / pf.value) * 100 : 0 }));
  const best = [...pf.rows].filter(r => r.cost > 0).sort((a, b) => b.pnlPct - a.pnlPct)[0];

  const stats: { label: string; val: string; pct?: number; up?: boolean }[] = [
    { label: "Total invested", val: fUSDT(pf.cost) },
    { label: "Current value", val: loading ? "..." : fUSDT(pf.value) },
    { label: "Total return", val: (pf.pnl >= 0 ? "+" : "−") + fUSDT(Math.abs(pf.pnl)), pct: pf.pnlPct, up: pf.pnl >= 0 },
    { label: "Best performer", val: best ? best.sym : "-", pct: best?.pnlPct || 0, up: (best?.pnlPct || 0) >= 0 },
  ];

  return (
    <AppShell>
      <Container max={1200} style={{ padding: "36px 32px 64px" }}>
        <h1 style={{ font: "700 32px var(--font)", color: "var(--text-hi)", letterSpacing: "-.025em", marginBottom: 6 }}>Portfolio</h1>
        <p style={{ font: "500 15px var(--font)", color: "var(--text-3)", marginBottom: 28 }}>Track your performance, allocation, and profit & loss over time.</p>

        <div data-reveal="scale" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 28, boxShadow: "var(--shadow-card)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ font: "500 13.5px var(--font)", color: "var(--text-3)" }}>Portfolio value</div>
              <div style={{ font: "600 42px var(--mono)", color: "var(--text-hi)", letterSpacing: "-.02em", margin: "6px 0 10px", fontVariantNumeric: "tabular-nums" }}>{fNum(pf.value, 2)} <span style={{ font: "500 22px var(--mono)", color: "var(--text-3)" }}>USDT</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <DeltaPill v={periodPct} />
                <span style={{ font: "500 14px var(--mono)", color: periodReturn >= 0 ? "var(--up)" : "var(--down)" }}>{periodReturn >= 0 ? "+" : "−"}{fUSDT(Math.abs(periodReturn))}</span>
                <span style={{ font: "500 13.5px var(--font)", color: "var(--text-3)" }}>all time return</span>
              </div>
            </div>
            <div style={{ display: "none" }}>
              {PTF.map(([id]) => (
                <button key={id} onClick={() => setTf(id)} style={{ padding: "7px 15px", borderRadius: "var(--r-pill)", border: "none", cursor: "pointer",
                  background: tf === id ? "var(--blue)" : "transparent", color: tf === id ? "#fff" : "var(--text-3)", font: "600 13px var(--font)" }}>{id}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}><AreaChart data={curve} h={220} showAxis /></div>
        </div>

        <div data-reveal="1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20 }}>
              <div style={{ font: "500 13px var(--font)", color: "var(--text-3)" }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 8 }}>
                <span style={{ font: "600 22px var(--mono)", color: s.up === undefined ? "var(--text-hi)" : (s.up ? "var(--up)" : "var(--down)"), fontVariantNumeric: "tabular-nums" }}>{s.val}</span>
                {s.pct !== undefined && <Delta v={s.pct} size={12.5} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 20, alignItems: "start" }}>
          <div data-reveal="slide-left" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24, boxShadow: "var(--shadow-card)" }}>
            <div style={{ font: "700 16px var(--font)", color: "var(--text-hi)", marginBottom: 20 }}>Asset allocation</div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <Donut slices={slices} size={188} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ font: "500 11.5px var(--font)", color: "var(--text-3)" }}>USDT</span>
                <span style={{ font: "600 19px var(--mono)", color: "var(--text-hi)" }}>{fCompact(pf.value)}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 22 }}>
              {slices.map(s => (
                <div key={s.sym} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: "none" }} />
                  <span style={{ font: "600 13.5px var(--font)", color: "var(--text-hi)", flex: 1 }}>{s.sym}</span>
                  <span style={{ font: "500 13px var(--mono)", color: "var(--text-2)" }}>{fUSDT(s.value)}</span>
                  <span style={{ font: "500 13px var(--mono)", color: "var(--text-3)", width: 50, textAlign: "right" }}>{s.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal="slide-right" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
            <div style={{ padding: "20px 24px", font: "700 16px var(--font)", color: "var(--text-hi)", borderBottom: "1px solid var(--border)" }}>Asset breakdown <span style={{ font: "500 13px var(--font)", color: "var(--text-3)", marginLeft: 6 }}>· all values in USDT</span></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Asset", "Holdings", "Avg cost", "Price", "Value (USDT)", "Profit / Loss"].map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "13px 24px", font: "600 11px var(--font)", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {pf.rows.map(r => (
                  <tr key={r.sym} className="mkt-row" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <CoinBadge sym={r.sym} size={36} />
                        <div><div style={{ font: "600 14px var(--font)", color: "var(--text-hi)" }}>{r.name}</div><div style={{ font: "500 12px var(--font)", color: "var(--text-3)" }}>{r.sym}</div></div>
                      </div>
                    </td>
                    <td style={tdRm}>{fNum(r.qty, r.qty < 1 ? 4 : 2)}</td>
                    <td style={tdRm}>{fUSDT(r.avg, r.avg < 10 ? 4 : 2)}</td>
                    <td style={tdRm}>{fUSDT(r.price, r.price < 10 ? 4 : 2)}</td>
                    <td style={{ ...tdRm, color: "var(--text-hi)", fontWeight: 600 }}>{fUSDT(r.value)}</td>
                    <td style={{ textAlign: "right", padding: "14px 24px" }}>
                      {r.cost > 0 ? (
                        <>
                          <div style={{ font: "600 13.5px var(--mono)", color: r.pnl >= 0 ? "var(--up)" : "var(--down)", fontVariantNumeric: "tabular-nums" }}>
                            {r.pnl >= 0 ? "+" : "−"}{fUSDT(Math.abs(r.pnl))}
                          </div>
                          <div style={{ marginTop: 2, font: "500 11px var(--font)", color: r.pnl >= 0 ? "var(--up)" : "var(--down)" }}>
                            {r.pnl >= 0 ? "+" : "−"}{Math.abs(r.pnlPct).toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div style={{ font: "600 13.5px var(--mono)", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>N/A</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
