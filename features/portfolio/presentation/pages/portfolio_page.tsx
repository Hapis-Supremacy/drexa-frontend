"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TradingLayout } from '@/features/core/presentation/components/trading_layout';
import {
  TIcon, CoinBadge, Panel, Delta, AreaChart,
  btnBrand, btnGhost, linkBtn, thL, thR, tdL, tdR,
} from '@/features/core/presentation/components/primitives';
import { DONUT_COLORS, ACTIVITY, portfolioTotals } from '@/features/core/domain/data/mock_data';
import { series, fmtUSD, fmtNum, fmtPct } from '@/features/core/domain/data/trading_utils';
import { useMarketStream } from '@/features/core/presentation/hooks/use_market_stream';

const ranges = ['1W', '1M', '1Y', 'All'];
const rangeSeeds: Record<string, number> = { '1W': 5, '1M': 9, '1Y': 19, All: 33 };

function Donut({ slices, size = 168 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const R = size / 2, r = R * 0.62, cx = R, cy = R;
  const arc = (start: number, frac: number) => {
    const a0 = start, a1 = start + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const p = (a: number, rad: number) => `${cx + rad * Math.cos(a)} ${cy + rad * Math.sin(a)}`;
    return `M ${p(a0, R)} A ${R} ${R} 0 ${large} 1 ${p(a1, R)} L ${p(a1, r)} A ${r} ${r} 0 ${large} 0 ${p(a0, r)} Z`;
  };
  const paths = slices.reduce(
    (acc, slice) => {
      const fraction = slice.value / total;
      return {
        start: acc.start + fraction * Math.PI * 2,
        paths: [...acc.paths, { label: slice.label, color: slice.color, d: arc(acc.start, fraction) }],
      };
    },
    { start: -Math.PI / 2, paths: [] as { label: string; color: string; d: string }[] }
  ).paths;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map(path => <path key={path.label} d={path.d} fill={path.color} />)}
    </svg>
  );
}

export function PortfolioPage() {
  const router = useRouter();
  const { tickers } = useMarketStream();
  const tot = useMemo(() => portfolioTotals(tickers), [tickers]);
  const [range, setRange] = useState('1M');
  const curve = useMemo(() => series(rangeSeeds[range], 70, 0.045, tot.value * 0.84), [range, tot.value]);
  const slices = tot.rows.map(r => ({ label: r.sym, value: r.value, color: DONUT_COLORS[r.sym] ?? '#2A3152' }));

  return (
    <TradingLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 56px' }}>
        <h1 style={{ font: 'var(--h1)', color: 'var(--fg)', letterSpacing: '-.01em', marginBottom: 20 }}>Portfolio</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* balance + chart */}
          <Panel pad={0} style={{ background: 'var(--surface-card)', overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Total balance</div>
                <div style={{ font: '800 38px var(--font-num)', color: 'var(--fg)', letterSpacing: '-.02em', margin: '6px 0 10px', fontVariantNumeric: 'tabular-nums' }}>{fmtUSD(tot.value)}</div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <span style={{ font: 'var(--small)', color: 'var(--fg-3)', display: 'inline-flex', gap: 6 }}>Today <Delta v={(tot.today / tot.value) * 100} icon /></span>
                  <span style={{ font: 'var(--small)', color: 'var(--fg-3)', display: 'inline-flex', gap: 6 }}>All-time <Delta v={tot.pnlPct} /></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {ranges.map(r => (
                  <button key={r} onClick={() => setRange(r)} style={{
                    padding: '5px 11px', borderRadius: 'var(--r-xs)', border: 'none', cursor: 'pointer', font: 'var(--micro)',
                    background: range === r ? 'var(--surface-raised)' : 'transparent',
                    color: range === r ? 'var(--fg)' : 'var(--fg-3)',
                  }}>{r}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 0 0' }}><AreaChart data={curve} up={curve[curve.length - 1] >= curve[0]} height={150} fillId="pfCurve" /></div>
            <div style={{ display: 'flex', gap: 10, padding: '0 24px 22px' }}>
              <button onClick={() => router.push('/wallet')} style={{ ...btnBrand, flex: 1 }}><TIcon name="download" size={16} color="#0b1020" />Deposit</button>
              <button onClick={() => router.push('/wallet')} style={{ ...btnGhost, flex: 1 }}><TIcon name="upload" size={16} color="var(--fg)" />Withdraw</button>
              <button onClick={() => router.push('/trade?sym=BTC')} style={{ ...btnGhost, flex: 1 }}><TIcon name="chart" size={16} color="var(--fg)" />Trade</button>
            </div>
          </Panel>

          {/* allocation + cost basis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Panel style={{ flex: 1 }}>
              <div style={{ font: 'var(--small)', color: 'var(--fg)', fontWeight: 700, marginBottom: 12 }}>Allocation</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', flex: 'none' }}>
                  <Donut slices={slices} size={148} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ font: 'var(--nano)', color: 'var(--fg-4)' }}>Assets</span>
                    <span style={{ font: '700 20px var(--font-num)', color: 'var(--fg)' }}>{tot.rows.length}</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {slices.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--micro)' }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: 'none' }} />
                      <span style={{ color: 'var(--fg-2)', flex: 1 }}>{s.label}</span>
                      <span style={{ color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{((s.value / tot.value) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ font: 'var(--nano)', color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Total cost</div>
                  <div style={{ font: '700 18px var(--font-num)', color: 'var(--fg)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{fmtUSD(tot.cost)}</div>
                </div>
                <div>
                  <div style={{ font: 'var(--nano)', color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Total P&L</div>
                  <div style={{ font: '700 18px var(--font-num)', color: tot.pnl >= 0 ? 'var(--up)' : 'var(--down)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>
                    {(tot.pnl >= 0 ? '+' : '') + fmtUSD(tot.pnl)}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* holdings */}
        <Panel pad={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ font: 'var(--h3)', color: 'var(--fg)', padding: '16px 18px' }}>Your holdings</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={thL}>Asset</th><th style={thR}>Balance</th><th style={thR}>Price</th>
              <th style={thR}>Value</th><th style={thR}>Avg cost</th><th style={thR}>P&amp;L</th>
              <th style={{ ...thR, width: 100 }}></th>
            </tr></thead>
            <tbody>
              {tot.rows.map(r => (
                <tr key={r.sym} style={{ borderTop: '1px solid var(--border-hairline)', cursor: 'pointer' }}
                  onClick={() => router.push('/markets/' + (r.sym === 'USDT' ? 'BTC' : r.sym))}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-raised)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={tdL}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CoinBadge sym={r.sym} size={32} />
                      <div>
                        <div style={{ font: '700 14px var(--font-sans)', color: 'var(--fg)' }}>{r.name}</div>
                        <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{r.sym}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtNum(r.qty, r.qty < 1 ? 4 : 2)} {r.sym}</td>
                  <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtUSD(r.price, r.price < 1 ? 4 : 2)}</td>
                  <td style={{ ...tdR, color: 'var(--fg)', fontWeight: 700 }}>{fmtUSD(r.value)}</td>
                  <td style={{ ...tdR, color: 'var(--fg-3)' }}>{r.avg === 1 ? '—' : fmtUSD(r.avg, r.avg < 1 ? 4 : 2)}</td>
                  <td style={tdR}>
                    {r.sym === 'USDT' ? (
                      <span style={{ color: 'var(--fg-4)' }}>—</span>
                    ) : (
                      <span style={{ color: r.pnl >= 0 ? 'var(--up)' : 'var(--down)', font: '700 13px var(--font-num)' }}>
                        {r.pnl >= 0 ? '+' : ''}{fmtUSD(r.pnl)}<br />
                        <span style={{ font: '500 11px var(--font-num)' }}>{fmtPct(r.pnlPct)}</span>
                      </span>
                    )}
                  </td>
                  <td style={tdR}>
                    <button onClick={e => { e.stopPropagation(); router.push('/trade?sym=' + (r.sym === 'USDT' ? 'BTC' : r.sym)); }} style={{ padding: '7px 16px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--fg)', font: 'var(--small)', cursor: 'pointer' }}>Trade</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* transactions */}
        <Panel pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px' }}>
            <span style={{ font: 'var(--h3)', color: 'var(--fg)' }}>Recent transactions</span>
            <button onClick={() => router.push('/orders')} style={linkBtn}>View all<TIcon name="chevRight" size={13} /></button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {ACTIVITY.map((x, i) => {
                const inflow = x.dir === 'in';
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                    <td style={tdL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 32, height: 32, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: inflow ? 'var(--up-soft)' : 'var(--down-soft)' }}>
                          <TIcon name={inflow ? 'arrowDown' : 'arrowUp'} size={15} color={inflow ? 'var(--up)' : 'var(--down)'} />
                        </span>
                        <div>
                          <div style={{ font: '700 14px var(--font-sans)', color: 'var(--fg)' }}>{x.t} {x.sym}</div>
                          <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{x.time}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtNum(x.amt, x.amt < 1 ? 4 : 2)} {x.sym}</td>
                    <td style={{ ...tdR, color: 'var(--fg)', fontWeight: 700 }}>{fmtUSD(x.val)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </TradingLayout>
  );
}
