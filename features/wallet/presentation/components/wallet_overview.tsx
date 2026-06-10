"use client";

import { useRouter } from 'next/navigation';
import { CoinBadge, Panel, TIcon, thL, thR, tdL, tdR } from '@/features/core/presentation/components/primitives';
import { fmtNum, fmtUSD } from '@/features/core/domain/data/trading_utils';
import type { HoldingRow } from '@/features/core/domain/model';
import type { WalletTab, WalletTransaction } from '@/features/wallet/domain/types';

const miniBtn: React.CSSProperties = {
  padding: '6px 13px',
  borderRadius: 'var(--r-xs)',
  border: '1px solid var(--border-subtle)',
  background: 'transparent',
  color: 'var(--fg-2)',
  font: 'var(--micro)',
  cursor: 'pointer',
};

const miniBtnBrand: React.CSSProperties = {
  padding: '6px 13px',
  borderRadius: 'var(--r-xs)',
  border: '1px solid rgba(0,255,163,.35)',
  background: 'rgba(0,255,163,.08)',
  color: 'var(--brand-mint)',
  font: 'var(--micro)',
  fontWeight: 700,
  cursor: 'pointer',
};

type WalletOverviewProps = {
  rows: HoldingRow[];
  transactions: WalletTransaction[];
  setTab: (tab: WalletTab) => void;
};

export function WalletOverview({ rows, transactions, setTab }: WalletOverviewProps) {
  return (
    <>
      <HoldingsTable rows={rows} setTab={setTab} />
      {transactions.length > 0 && <TransactionHistory transactions={transactions} />}
    </>
  );
}

function HoldingsTable({ rows, setTab }: { rows: HoldingRow[]; setTab: (tab: WalletTab) => void }) {
  const router = useRouter();

  return (
    <Panel pad={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>
          <th style={thL}>Asset</th><th style={thR}>Total</th><th style={thR}>Available</th>
          <th style={thR}>In orders</th><th style={thR}>Value</th>
          <th style={{ ...thR, width: 200 }}></th>
        </tr></thead>
        <tbody>
          {rows.map(row => {
            const locked = row.sym === 'BTC' || row.sym === 'ETH' ? row.qty * 0.18 : 0;
            return (
              <tr key={row.sym} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                <td style={tdL}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CoinBadge sym={row.sym} size={32} />
                    <div>
                      <div style={{ font: '700 14px var(--font-sans)', color: 'var(--fg)' }}>{row.name}</div>
                      <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{row.sym}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...tdR, color: 'var(--fg)', fontWeight: 700 }}>{fmtNum(row.qty, row.qty < 1 ? 4 : 2)}</td>
                <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtNum(row.qty - locked, row.qty < 1 ? 4 : 2)}</td>
                <td style={{ ...tdR, color: locked ? 'var(--warning)' : 'var(--fg-4)' }}>{locked ? fmtNum(locked, 4) : '-'}</td>
                <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtUSD(row.value)}</td>
                <td style={tdR}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {row.sym === 'USDT' ? (
                      <>
                        <button onClick={() => setTab('deposit')} style={miniBtn}>Deposit</button>
                        <button onClick={() => setTab('withdraw')} style={miniBtn}>Withdraw</button>
                        <button onClick={() => router.push('/trade')} style={miniBtn}>Trade</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => router.push('/trade?sym=' + row.sym)} style={miniBtnBrand}>Sell to USDT</button>
                        <button onClick={() => router.push('/trade?sym=' + row.sym)} style={miniBtn}>Trade</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function TransactionHistory({ transactions }: { transactions: WalletTransaction[] }) {
  return (
    <Panel pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 12px', font: 'var(--h3)', color: 'var(--fg)' }}>Transaction history</div>
      {transactions.map(transaction => {
        const inflow = transaction.type === 'deposit';
        const usd = transaction.amount / 100;
        const date = new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusColor = transaction.status === 'completed' ? 'var(--up)' : transaction.status === 'failed' ? 'var(--down)' : 'var(--warning)';

        return (
          <div key={transaction.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: '1px solid var(--border-hairline)' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: inflow ? 'var(--up-soft)' : 'var(--down-soft)' }}>
              <TIcon name={inflow ? 'arrowDown' : 'arrowUp'} size={15} color={inflow ? 'var(--up)' : 'var(--down)'} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 13px var(--font-sans)', color: 'var(--fg)', textTransform: 'capitalize' }}>{transaction.type}</div>
              <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: '700 13px var(--font-num)', color: inflow ? 'var(--up)' : 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                {inflow ? '+' : '-'}{fmtUSD(usd)}
              </div>
              <div style={{ font: 'var(--nano)', color: statusColor, textTransform: 'capitalize' }}>{transaction.status}</div>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
