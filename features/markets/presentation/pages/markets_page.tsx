"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TradingLayout } from '@/features/core/presentation/components/trading_layout';
import {
  TIcon, CoinBadge, Panel, Delta, Sparkline,
  thL, thR, tdL, tdR,
} from '@/features/core/presentation/components/primitives';
import { COINS } from '@/features/core/domain/data/mock_data';
import { fmtUSD, fmtCompact } from '@/features/core/domain/data/trading_utils';
import { fetchMarkets, cgToCoinData } from '@/lib/coingecko';
import type { CoinData } from '@/features/core/domain/model';

export function MarketsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [fav, setFav] = useState<Set<string>>(() => new Set(['BTC', 'SOL']));
  const [coins, setCoins] = useState<CoinData[]>(COINS);
  const toggleFav = (s: string) => setFav(prev => {
    const next = new Set(prev);
    if (next.has(s)) {
      next.delete(s);
    } else {
      next.add(s);
    }
    return next;
  });

  useEffect(() => {
    fetchMarkets()
      .then(data => setCoins(data.map(cgToCoinData)))
      .catch(() => {});
  }, []);

  const tabs: [string, string][] = [
    ['all', 'All assets'], ['gainers', 'Top gainers'], ['losers', 'Top losers'], ['favorites', 'Watchlist'],
  ];

  let rows = [...coins];
  if (q.trim()) rows = rows.filter(c => (c.sym + ' ' + c.name).toLowerCase().includes(q.toLowerCase()));
  if (tab === 'gainers')   rows = rows.filter(c => c.ch > 0).sort((a, b) => b.ch - a.ch);
  if (tab === 'losers')    rows = rows.filter(c => c.ch < 0).sort((a, b) => a.ch - b.ch);
  if (tab === 'favorites') rows = rows.filter(c => fav.has(c.sym));

  const movers = [...coins].sort((a, b) => b.ch - a.ch).slice(0, 4);

  return (
    <TradingLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ font: 'var(--h1)', color: 'var(--fg)', letterSpacing: '-.01em' }}>Markets</h1>
            <p style={{ font: 'var(--small)', color: 'var(--fg-3)', marginTop: 4 }}>Spot trading · {coins.length} pairs · settled in USDT</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', width: 260, background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)' }}>
            <TIcon name="search" size={16} color="var(--fg-3)" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search coin or pair…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', font: 'var(--small)', minWidth: 0 }} />
          </div>
        </div>

        {/* movers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {movers.map(c => {
            const up = c.ch >= 0;
            return (
              <button key={c.sym} onClick={() => router.push('/markets/' + c.sym)} style={{
                textAlign: 'left', cursor: 'pointer', background: 'var(--surface)',
                border: '1px solid var(--border-hairline)', borderRadius: 'var(--r-md)',
                padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hairline)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CoinBadge sym={c.sym} size={30} />
                  <div>
                    <div style={{ font: '700 14px var(--font-sans)', color: 'var(--fg)' }}>{c.sym}</div>
                    <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{c.name}</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <Sparkline data={c.spark} up={up} w={64} h={26} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ font: '700 18px var(--font-num)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{fmtUSD(c.price, c.price < 1 ? 4 : 2)}</span>
                  <Delta v={c.ch} icon />
                </div>
              </button>
            );
          })}
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '8px 14px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
              background: tab === id ? 'var(--surface-raised)' : 'transparent',
              color: tab === id ? 'var(--fg)' : 'var(--fg-3)', font: 'var(--small)',
            }}>{label}</button>
          ))}
        </div>

        {/* table */}
        <Panel pad={0} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thL}>Asset</th>
                <th style={thR}>Last price</th>
                <th style={thR}>24h change</th>
                <th style={thR}>24h volume</th>
                <th style={thR}>Market cap</th>
                <th style={thR}>Last 7d</th>
                <th style={{ ...thR, width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const up = c.ch >= 0;
                return (
                  <tr key={c.sym} style={{ borderTop: '1px solid var(--border-hairline)', cursor: 'pointer' }}
                    onClick={() => router.push('/markets/' + c.sym)}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--surface-raised)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={tdL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={e => { e.stopPropagation(); toggleFav(c.sym); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                          <TIcon name="star" size={16} color={fav.has(c.sym) ? 'var(--warning)' : 'var(--fg-4)'} />
                        </button>
                        <CoinBadge sym={c.sym} size={32} />
                        <div>
                          <div style={{ font: '700 14px var(--font-sans)', color: 'var(--fg)' }}>{c.name}</div>
                          <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{c.sym}/USDT</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdR, font: '700 15px var(--font-num)', color: 'var(--fg)' }}>{fmtUSD(c.price, c.price < 1 ? 4 : 2)}</td>
                    <td style={tdR}><Delta v={c.ch} /></td>
                    <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtCompact(c.vol)}</td>
                    <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtCompact(c.mcap)}</td>
                    <td style={tdR}><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Sparkline data={c.spark} up={up} w={100} h={32} /></div></td>
                    <td style={tdR}>
                      <button onClick={e => { e.stopPropagation(); router.push('/trade?sym=' + c.sym); }} style={{
                        padding: '8px 18px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)',
                        background: 'transparent', color: 'var(--fg)', font: 'var(--small)', cursor: 'pointer',
                      }}>Trade</button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', font: 'var(--small)', color: 'var(--fg-3)' }}>
                  {tab === 'favorites' ? 'No coins in your watchlist yet — tap the star on any asset.' : 'No assets match your search.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </TradingLayout>
  );
}
