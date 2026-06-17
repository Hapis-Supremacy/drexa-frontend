"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TradingLayout } from '@/features/core/presentation/components/trading_layout';
import {
  TIcon, CoinBadge, Panel, Delta,
  linkBtn, thL, thR, tdL, tdR,
} from '@/features/core/presentation/components/primitives';
import { COINS, OPEN_ORDERS, ORDER_HISTORY, coinOf } from '@/features/core/domain/data/mock_data';
import { rng, series, fmtUSD, fmtNum, fmtCompact } from '@/features/core/domain/data/trading_utils';
import { useMarketStream } from '@/features/core/presentation/hooks/use_market_stream';

/* ── Candle chart ───────────────────────────────────────────────── */
interface Candle { o: number; h: number; l: number; c: number; }
function makeCandles(seed: number, n: number, base: number, vol: number): Candle[] {
  const r = rng(seed); const out: Candle[] = []; let prev = base;
  for (let i = 0; i < n; i++) {
    const o = prev, c = Math.max(0.01, o * (1 + (r() - 0.47) * vol));
    const h = Math.max(o, c) * (1 + r() * vol * 0.5), l = Math.min(o, c) * (1 - r() * vol * 0.5);
    out.push({ o, h, l, c }); prev = c;
  }
  return out;
}

function PriceAxis({ grid, top, span }: { grid: number; top: number; span: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: grid + 1 }).map((_, i) => {
        const val = top - (span / grid) * i;
        return (
          <span key={i} style={{ position: 'absolute', right: 6, top: `calc(${(100 / grid) * i}% - 8px)`, font: '500 11px var(--font-num)', color: 'var(--fg-4)', fontVariantNumeric: 'tabular-nums' }}>
            {val < 1 ? val.toFixed(4) : val.toFixed(0)}
          </span>
        );
      })}
    </div>
  );
}

function PriceChart({ seed, base }: { seed: number; base: number }) {
  const [tf, setTf] = useState('1H');
  const tfs = ['15m', '1H', '4H', '1D', '1W'];
  const height = 380;
  const candles = useMemo(() => makeCandles(seed + tf.length, 60, base, 0.045), [seed, tf, base]);
  const hi = Math.max(...candles.map(c => c.h)), lo = Math.min(...candles.map(c => c.l));
  const pad = (hi - lo) * 0.08, top = hi + pad, bot = lo - pad, span = top - bot;
  const W = 1000, H = height, gw = W / candles.length, bw = gw * 0.6;
  const y = (v: number) => H - ((v - bot) / span) * H;

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {tfs.map(tt => (
          <button key={tt} onClick={() => setTf(tt)} style={{
            padding: '5px 12px', borderRadius: 'var(--r-xs)', border: 'none', cursor: 'pointer', font: 'var(--micro)',
            background: tf === tt ? 'var(--surface-raised)' : 'transparent',
            color: tf === tt ? 'var(--fg)' : 'var(--fg-3)',
          }}>{tt}</button>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1="0" y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
          ))}
          {candles.map((c, i) => {
            const cup = c.c >= c.o;
            const col = cup ? 'var(--up)' : 'var(--down)';
            const x = i * gw + gw / 2;
            return (
              <g key={i}>
                <line x1={x} y1={y(c.h)} x2={x} y2={y(c.l)} stroke={col} strokeWidth="1.4" />
                <rect x={x - bw / 2} y={Math.min(y(c.o), y(c.c))} width={bw}
                  height={Math.max(2, Math.abs(y(c.o) - y(c.c)))} fill={col} rx="1" />
              </g>
            );
          })}
        </svg>
        <PriceAxis grid={5} top={top} span={span} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${((top - candles[candles.length - 1].c) / span) * 100}%`, borderTop: '1px dashed rgba(0,255,163,.5)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/* ── Order book ─────────────────────────────────────────────────── */
function OrderBook({ price }: { price: number }) {
  const rows = useMemo(() => {
    const r = rng(Math.round(price));
    const mk = (sign: number) => Array.from({ length: 9 }).map((_, i) => {
      const p = price * (1 + sign * (i + 1) * 0.0008);
      const amt = +(r() * 2.4 + 0.05).toFixed(4);
      return { p, amt, total: +(p * amt).toFixed(0) };
    });
    return { asks: mk(1).reverse(), bids: mk(-1) };
  }, [price]);
  const maxTot = Math.max(...[...rows.asks, ...rows.bids].map(r => r.total));

  const Row = ({ r, side }: { r: { p: number; amt: number; total: number }; side: 'bid' | 'ask' }) => {
    const up = side === 'bid';
    return (
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '3px 12px', font: '500 12px var(--font-num)', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(r.total / maxTot) * 100}%`, background: up ? 'var(--up-soft)' : 'var(--down-soft)' }} />
        <span style={{ color: up ? 'var(--up)' : 'var(--down)', position: 'relative' }}>{r.p < 1 ? r.p.toFixed(4) : r.p.toFixed(2)}</span>
        <span style={{ color: 'var(--fg-2)', textAlign: 'right', position: 'relative' }}>{r.amt}</span>
        <span style={{ color: 'var(--fg-3)', textAlign: 'right', position: 'relative' }}>{r.total.toLocaleString()}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0 12px 8px', font: 'var(--nano)', color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        <span>Price</span><span style={{ textAlign: 'right' }}>Amount</span><span style={{ textAlign: 'right' }}>Total</span>
      </div>
      {rows.asks.map((r, i) => <Row key={'a' + i} r={r} side="ask" />)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBlock: '1px solid var(--border-hairline)', margin: '4px 0' }}>
        <span style={{ font: '700 17px var(--font-num)', color: 'var(--up)', fontVariantNumeric: 'tabular-nums' }}>{price < 1 ? price.toFixed(4) : fmtNum(price)}</span>
        <TIcon name="arrowUp" size={14} color="var(--up)" />
        <span style={{ font: 'var(--nano)', color: 'var(--fg-4)', marginLeft: 'auto' }}>Spread 0.08%</span>
      </div>
      {rows.bids.map((r, i) => <Row key={'b' + i} r={r} side="bid" />)}
    </div>
  );
}

/* ── Trade ticket ───────────────────────────────────────────────── */
function TField({ label, suffix, value, onChange, placeholder, disabled, readOnly }: { label: string; suffix: string; value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean; readOnly?: boolean }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', height: 46, marginTop: 6, padding: '0 12px', background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', opacity: disabled ? 0.5 : 1 }}>
        <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} disabled={disabled} readOnly={readOnly}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', font: '600 14px var(--font-num)', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
        <span style={{ font: 'var(--micro)', color: 'var(--fg-4)' }}>{suffix}</span>
      </div>
    </label>
  );
}

function TradeTicket({ coin }: { coin: ReturnType<typeof coinOf> }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState('market');
  const [price, setPrice] = useState(coin.price.toFixed(coin.price < 1 ? 4 : 2));
  const [pctRaw, setPct] = useState(0);
  const buy = side === 'buy';
  const px = type === 'market' ? coin.price : (parseFloat(price) || coin.price);
  const quote = buy ? 6420 : 8420;
  const total = (quote * pctRaw) / 100, amount = total / px;
  const accent = buy ? 'var(--up)' : 'var(--down)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--surface-input)', padding: 4, borderRadius: 'var(--r-sm)' }}>
        {(['buy', 'sell'] as const).map(s => (
          <button key={s} onClick={() => { setSide(s); setPct(0); }} style={{
            padding: '9px 0', borderRadius: 'var(--r-xs)', border: 'none', cursor: 'pointer', textTransform: 'capitalize',
            font: 'var(--body-strong)',
            background: side === s ? (s === 'buy' ? 'var(--up)' : 'var(--down)') : 'transparent',
            color: side === s ? '#0b1020' : 'var(--fg-3)',
          }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-hairline)' }}>
        {['market', 'limit', 'stop'].map(tt => (
          <button key={tt} onClick={() => setType(tt)} style={{
            padding: '0 0 8px', border: 'none', background: 'none', cursor: 'pointer', textTransform: 'capitalize', font: 'var(--small)',
            color: type === tt ? 'var(--fg)' : 'var(--fg-3)',
            borderBottom: type === tt ? '2px solid var(--brand-blue)' : '2px solid transparent', marginBottom: -1,
          }}>{tt}</button>
        ))}
      </div>
      <TField label={type === 'stop' ? 'Stop price' : 'Price'} suffix="USDT" disabled={type === 'market'} value={type === 'market' ? 'Market price' : price} onChange={setPrice} />
      <TField label="Amount" suffix={coin.sym} value={amount ? amount.toFixed(coin.price < 1 ? 0 : 5) : ''} placeholder="0.00" readOnly />
      <div>
        <input type="range" min="0" max="100" value={pctRaw} onChange={e => setPct(+e.target.value)} style={{ width: '100%', accentColor: buy ? 'var(--up)' : 'var(--down)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {[0, 25, 50, 75, 100].map(p => (
            <button key={p} onClick={() => setPct(p)} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--nano)', color: pctRaw === p ? accent : 'var(--fg-4)' }}>{p}%</button>
          ))}
        </div>
      </div>
      <TField label="Total" suffix="USDT" value={total ? total.toFixed(2) : ''} placeholder="0.00" readOnly />
      <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--micro)', color: 'var(--fg-3)' }}>
        <span>{buy ? 'Available' : 'Position'}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{buy ? fmtUSD(quote) + ' USDT' : '0.1312 ' + coin.sym}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--micro)', color: 'var(--fg-3)' }}>
        <span>Est. fee (0.10%)</span><span>{fmtUSD(total * 0.001)}</span>
      </div>
      <button style={{ height: 50, border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'var(--body-strong)', background: buy ? 'var(--up)' : 'var(--down)', color: '#0b1020' }}>
        {buy ? 'Buy' : 'Sell'} {coin.sym}
      </button>
    </div>
  );
}

/* ── Pair header ────────────────────────────────────────────────── */
function Stat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div>
      <div style={{ font: 'var(--nano)', color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ font: '700 14px var(--font-num)', color: color ?? 'var(--fg)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function PairHeader({ coin, setSym }: { coin: ReturnType<typeof coinOf>; setSym: (s: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '14px 18px', borderBottom: '1px solid var(--border-hairline)', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CoinBadge sym={coin.sym} size={30} />
        <select value={coin.sym} onChange={e => setSym(e.target.value)} style={{ background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', color: 'var(--fg)', font: '700 16px var(--font-sans)', padding: '8px 12px', cursor: 'pointer' }}>
          {COINS.map(c => <option key={c.sym} value={c.sym}>{c.sym}/USDT</option>)}
        </select>
      </div>
      <Stat label="Last price" value={fmtUSD(coin.price, coin.price < 1 ? 4 : 2)} color={coin.ch >= 0 ? 'var(--up)' : 'var(--down)'} />
      <Stat label="24h change" value={<Delta v={coin.ch} />} />
      <Stat label="24h high"   value={fmtNum(coin.high ?? coin.price * 1.04, coin.price < 1 ? 4 : 2)} />
      <Stat label="24h low"    value={fmtNum(coin.low ?? coin.price * 0.96, coin.price < 1 ? 4 : 2)} />
      <Stat label="24h volume" value={fmtCompact(coin.vol)} />
    </div>
  );
}

/* ── Docked open orders ─────────────────────────────────────────── */
function DockedOrders() {
  const router = useRouter();
  const [tab, setTab] = useState('open');
  return (
    <Panel pad={0}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 18px', borderBottom: '1px solid var(--border-hairline)' }}>
        {([['open', `Open orders (${OPEN_ORDERS.length})`], ['history', 'Order history']] as [string, string][]).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'var(--small)', color: tab === id ? 'var(--fg)' : 'var(--fg-3)' }}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/orders')} style={linkBtn}>Full order manager<TIcon name="chevRight" size={13} /></button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thL}>Pair</th><th style={thL}>Side · Type</th>
          <th style={thR}>Price</th><th style={thR}>Amount</th>
          <th style={thR}>Filled</th><th style={thR}>Time</th><th style={thR}></th>
        </tr></thead>
        <tbody>
          {(tab === 'open' ? OPEN_ORDERS : ORDER_HISTORY.slice(0, 4)).map((o, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border-hairline)', font: '500 13px var(--font-num)', fontVariantNumeric: 'tabular-nums' }}>
              <td style={{ ...tdL, fontWeight: 700, color: 'var(--fg)' }}>{o.sym}/USDT</td>
              <td style={{ ...tdL, color: o.side === 'buy' ? 'var(--up)' : 'var(--down)', textTransform: 'capitalize', fontWeight: 700 }}>{o.side} · {o.type}</td>
              <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtNum(o.price, o.price < 1 ? 4 : 2)}</td>
              <td style={{ ...tdR, color: 'var(--fg-2)' }}>{o.amt} {o.sym}</td>
              <td style={{ ...tdR, color: 'var(--fg-3)' }}>{tab === 'open' ? (('filled' in o ? o.filled : 0) + '%') : (('status' in o ? o.status : '—'))}</td>
              <td style={{ ...tdR, color: 'var(--fg-3)' }}>{o.time.replace('Today · ', '')}</td>
              <td style={tdR}>{tab === 'open' && <button style={{ border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--fg-3)', borderRadius: 'var(--r-xs)', padding: '4px 12px', cursor: 'pointer', font: 'var(--nano)' }}>Cancel</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ── TradePage ──────────────────────────────────────────────────── */
export function TradePage({ sym: initialSym }: { sym?: string }) {
  const [sym, setSym] = useState(initialSym ?? 'BTC');
  const baseCoin = coinOf(sym);
  
  const { getTicker } = useMarketStream();
  const live = getTicker(sym);
  
  const coin = useMemo(() => {
    if (live) {
      return { ...baseCoin, price: live.price, ch: live.ch, vol: live.vol, high: live.high, low: live.low };
    }
    return baseCoin;
  }, [baseCoin, live]);

  return (
    <TradingLayout>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '18px 20px 44px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px 320px', gap: 16, alignItems: 'start' }}>
          <Panel pad={0} style={{ overflow: 'hidden' }}>
            <PairHeader coin={coin} setSym={setSym} />
            <div style={{ padding: 18 }}><PriceChart seed={coin.seed} base={coin.price} /></div>
          </Panel>
          <Panel pad={0} style={{ paddingBlock: 14 }}>
            <div style={{ font: 'var(--small)', color: 'var(--fg)', fontWeight: 700, padding: '0 12px 10px' }}>Order book</div>
            <OrderBook price={coin.price} />
          </Panel>
          <Panel><TradeTicket coin={coin} /></Panel>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '12px 16px', background: 'rgba(251,214,11,.07)', border: '1px solid rgba(251,214,11,.18)', borderRadius: 'var(--r-sm)' }}>
          <TIcon name="shield" size={18} color="var(--warning)" />
          <span style={{ font: 'var(--small)', color: 'var(--fg-2)' }}>Crypto is volatile. Drexa is spot-only — you trade with funds you own, no leverage. Never invest more than you can afford to lose.</span>
        </div>

        <div style={{ marginTop: 16 }}><DockedOrders /></div>
      </div>
    </TradingLayout>
  );
}
