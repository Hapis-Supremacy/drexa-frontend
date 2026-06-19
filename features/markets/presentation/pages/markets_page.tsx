"use client";

/* ── Drexa — Markets / Explore page ── */
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/features/core/presentation/components/app_shell";
import {
  Icon, Container, CoinBadge, Delta, DeltaPill, Sparkline,
  fUSD, fCompact, rng, series,
} from "@/features/core/presentation/components/drexa_kit";
import { useMarketStream } from "@/features/core/presentation/hooks/use_market_stream";
import { useScrollReveal } from "@/features/core/presentation/hooks/use_scroll_reveal";

const MK_RAW = [
  { sym: "BTC", name: "Bitcoin",   price: 64182.50, ch: 2.41,  vol: 1284.3e6, mcap: 1264e9, seed: 7 },
  { sym: "ETH", name: "Ethereum",  price: 3108.74,  ch: -1.08, vol: 842.1e6,  mcap: 373e9,  seed: 13 },
  { sym: "BNB", name: "BNB",       price: 592.16,   ch: 0.84,  vol: 230.4e6,  mcap: 87e9,   seed: 29 },
  { sym: "SOL", name: "Solana",    price: 148.20,   ch: 5.62,  vol: 410.7e6,  mcap: 68e9,   seed: 21 },
  { sym: "USDT",name: "Tether",    price: 1.00,     ch: 0.00,  vol: 45000e6,  mcap: 110e9,  seed: 99 },
];
interface MKCoin { sym: string; name: string; price: number; ch: number; vol: number; mcap: number; seed: number; ch1h: number; ch7d: number; spark: number[]; }
const MK: MKCoin[] = MK_RAW.map(c => {
  const r = rng(c.seed * 3 + 1);
  return { ...c, ch1h: +(c.ch * 0.16 + (r() - 0.5) * 0.6).toFixed(2), ch7d: +(c.ch * 2.3 + (r() - 0.5) * 6).toFixed(2), spark: series(c.seed, 32, 0.05, c.price) };
});

function Highlight({ label, icon, tint, coin, metric }: { label: string; icon: string; tint: string; coin: MKCoin; metric: ReactNode }) {
  return (
    <div className="lift">
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 20, boxShadow: "var(--shadow-card)", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Icon name={icon} size={16} color={tint} />
          <span style={{ font: "600 13px var(--font)", color: "var(--text-2)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CoinBadge sym={coin.sym} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "600 15px var(--font)", color: "var(--text-hi)" }}>{coin.sym}</div>
            <div style={{ font: "500 12.5px var(--mono)", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{fUSD(coin.price, coin.price < 1 ? 4 : 2)}</div>
          </div>
          {metric}
        </div>
      </div>
    </div>
  );
}

type Sort = { k: string; dir: "asc" | "desc" };
function SortTH({ label, k, sort, setSort, align = "right", w }: { label: string; k: string; sort: Sort; setSort: (fn: (s: Sort) => Sort) => void; align?: "left" | "right"; w?: number }) {
  const active = sort.k === k;
  return (
    <th style={{ textAlign: align, padding: 0, width: w }}>
      <button onClick={() => setSort(s => ({ k, dir: s.k === k && s.dir === "desc" ? "asc" : "desc" }))}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "15px 24px", background: "none", border: "none", cursor: "pointer",
          font: "600 11.5px var(--font)", color: active ? "var(--text-hi)" : "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em",
          flexDirection: align === "right" ? "row-reverse" : "row", marginLeft: align === "left" ? 0 : "auto" }}>
        {label}
        <Icon name="chevDown" size={13} color="currentColor" style={{ opacity: active ? 1 : 0.35, transform: active && sort.dir === "asc" ? "rotate(180deg)" : "none" }} />
      </button>
    </th>
  );
}

export function MarketsPage() {
  const router = useRouter();
  useScrollReveal();
  const [tf, setTf] = useState("24h");
  const [sort, setSort] = useState<Sort>({ k: "mcap", dir: "desc" });
  const chOf = (c: MKCoin) => tf === "1h" ? c.ch1h : tf === "7d" ? c.ch7d : c.ch;

  // Live prices + 24h change from the gateway market stream, overlaid on the seed list.
  const { tickers } = useMarketStream();

  const rows = useMemo(() => {
    let r = MK.map(c => {
      const t = tickers[c.sym];
      return t ? { ...c, price: t.price, ch: t.ch, vol: t.vol } : c;
    });
    const key = sort.k === "change" ? (c: MKCoin) => chOf(c) : (c: MKCoin) => (c as unknown as Record<string, number>)[sort.k];
    r.sort((a, b) => sort.dir === "desc" ? key(b) - key(a) : key(a) - key(b));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, tf, tickers]);

  const topGainer = [...rows].sort((a, b) => chOf(b) - chOf(a))[0];
  const topLoser = [...rows].sort((a, b) => chOf(a) - chOf(b))[0];
  const topVol = [...rows].sort((a, b) => b.vol - a.vol)[0];
  const trending = [...rows].sort((a, b) => b.ch7d - a.ch7d)[0];

  const stats = [
    { label: "Total market cap", val: "$2.07T", d: -2.03 },
    { label: "24h volume", val: "$159.8B", d: 3.41 },
    { label: "BTC dominance", val: "59.85%", d: -0.10 },
    { label: "Active assets", val: "5", d: 0 },
  ];
  const headTh: CSSProperties = { textAlign: "right", padding: "15px 24px", font: "600 11.5px var(--font)", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".05em" };

  return (
    <AppShell>
      <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", width: 620, height: 360, left: "-120px", top: "-200px", background: "rgba(26,111,212,0.14)", borderRadius: "50%", filter: "blur(110px)", pointerEvents: "none" }} />
        <Container style={{ position: "relative", padding: "48px 32px 36px" }}>
          <h1 style={{ font: "700 38px var(--font)", color: "var(--text-hi)", letterSpacing: "-.025em" }}>Markets</h1>
          <p style={{ font: "500 16px var(--font)", color: "var(--text-2)", marginTop: 8 }}>Explore real-time prices, charts, and trends across {MK.length}+ assets.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 28 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px" }}>
                <div style={{ font: "500 12.5px var(--font)", color: "var(--text-3)" }}>{s.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 7 }}>
                  <span style={{ font: "600 21px var(--mono)", color: "var(--text-hi)", fontVariantNumeric: "tabular-nums" }}>{s.val}</span>
                  <Delta v={s.d} size={12} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container style={{ padding: "36px 32px 8px" }}>
        <div data-reveal="scale" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 32 }}>
          <Highlight label="Top gainer" icon="gain" tint="var(--up)" coin={topGainer} metric={<DeltaPill v={topGainer.ch} />} />
          <Highlight label="Top loser" icon="loss" tint="var(--down)" coin={topLoser} metric={<DeltaPill v={topLoser.ch} />} />
          <Highlight label="Highest volume" icon="performance" tint="var(--blue-hover)" coin={topVol} metric={<span style={{ font: "600 13px var(--mono)", color: "var(--text-2)" }}>{fCompact(topVol.vol)}</span>} />
          <Highlight label="Trending" icon="alerts" tint="var(--warn)" coin={trending} metric={<DeltaPill v={trending.ch} />} />
        </div>

        <div data-reveal="1" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18, justifyContent: "flex-end" }}>
          <div style={{ display: "flex", gap: 2, background: "var(--card)", padding: 3, borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
            {["1h", "24h", "7d"].map(t => (
              <button key={t} onClick={() => setTf(t)} style={{
                padding: "7px 12px", borderRadius: "var(--r-xs)", border: "none", cursor: "pointer",
                background: tf === t ? "var(--card-2)" : "transparent", color: tf === t ? "var(--text-hi)" : "var(--text-3)", font: "600 12.5px var(--mono)", textTransform: "uppercase",
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div data-reveal="1" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <SortTH label="Name" k="name_" sort={sort} setSort={setSort} align="left" w={220} />
                <SortTH label="Price" k="price" sort={sort} setSort={setSort} />
                <SortTH label={`${tf} %`} k="change" sort={sort} setSort={setSort} />
                <SortTH label="Market cap" k="mcap" sort={sort} setSort={setSort} />
                <SortTH label="Volume (24h)" k="vol" sort={sort} setSort={setSort} />
                <th style={headTh}>Last 7 days</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.sym} className="mkt-row" style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td style={{ padding: "14px 24px 14px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                      <CoinBadge sym={c.sym} size={38} />
                      <div><div style={{ font: "600 14.5px var(--font)", color: "var(--text-hi)" }}>{c.name}</div><div style={{ font: "500 12px var(--font)", color: "var(--text-3)" }}>{c.sym}</div></div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", padding: "14px 24px", font: "600 14.5px var(--mono)", color: "var(--text-hi)", fontVariantNumeric: "tabular-nums" }}>{fUSD(c.price, c.price < 1 ? 4 : 2)}</td>
                  <td style={{ textAlign: "right", padding: "14px 24px" }}><Delta v={chOf(c)} size={13.5} icon /></td>
                  <td style={{ textAlign: "right", padding: "14px 24px", font: "500 14px var(--mono)", color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{fCompact(c.mcap)}</td>
                  <td style={{ textAlign: "right", padding: "14px 24px", font: "500 14px var(--mono)", color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>{fCompact(c.vol)}</td>
                  <td style={{ textAlign: "right", padding: "14px 24px" }}><div style={{ display: "flex", justifyContent: "flex-end" }}><Sparkline data={c.spark} up={c.ch7d >= 0} w={108} h={36} /></div></td>
                  <td style={{ textAlign: "right", padding: "14px 24px" }}><button onClick={() => router.push("/trade?sym=" + c.sym)} className="trade-btn">Trade</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <span style={{ font: "500 13px var(--font)", color: "var(--text-3)" }}>
              Showing all 5 assets
            </span>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
