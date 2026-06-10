"use client";

import { useMemo, useState } from 'react';
import { TradingLayout } from '@/features/core/presentation/components/trading_layout';
import { Panel } from '@/features/core/presentation/components/primitives';
import { holdingRows } from '@/features/core/domain/data/mock_data';
import { fmtUSD } from '@/features/core/domain/data/trading_utils';
import type { WalletTab } from '@/features/wallet/domain/types';
import { DepositPanel } from '@/features/wallet/presentation/components/deposit_panel';
import { WalletOverview } from '@/features/wallet/presentation/components/wallet_overview';
import { WithdrawPanel } from '@/features/wallet/presentation/components/withdraw_panel';
import { useWalletData } from '@/features/wallet/presentation/hooks/useWalletData';

const tabs: { id: WalletTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
];

function getInitialTab(): WalletTab {
  if (typeof window === 'undefined') return 'overview';
  return new URLSearchParams(window.location.search).has('payment_intent_client_secret')
    ? 'deposit'
    : 'overview';
}

export function WalletPage() {
  const [tab, setTab] = useState<WalletTab>(getInitialTab);
  const rows = useMemo(() => holdingRows(), []);
  const { walletUsd, transactions, refresh } = useWalletData(20);

  return (
    <TradingLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 56px' }}>
        <h1 style={{ font: 'var(--h1)', color: 'var(--fg)', letterSpacing: '-.01em', marginBottom: 20 }}>Wallet</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 22 }}>
          <Panel style={{ background: 'var(--surface-card)' }}>
            <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Cash balance</div>
            <div style={{ font: '800 26px var(--font-num)', color: 'var(--fg)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {walletUsd !== null ? fmtUSD(walletUsd) : '-'}
            </div>
          </Panel>
          <Panel>
            <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Portfolio value</div>
            <div style={{ font: '800 26px var(--font-num)', color: 'var(--up)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {fmtUSD(rows.reduce((total, row) => total + row.value, 0))}
            </div>
          </Panel>
          <Panel>
            <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Transactions</div>
            <div style={{ font: '800 26px var(--font-num)', color: 'var(--warning)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {transactions.length}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {tabs.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              padding: '9px 18px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              cursor: 'pointer',
              font: 'var(--small)',
              background: tab === item.id ? 'var(--surface-raised)' : 'transparent',
              color: tab === item.id ? 'var(--fg)' : 'var(--fg-3)',
            }}>{item.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <WalletOverview rows={rows} transactions={transactions} setTab={setTab} />
        )}

        {tab === 'deposit' && (
          <Panel pad={24}>
            <DepositPanel onRefresh={refresh} />
          </Panel>
        )}

        {tab === 'withdraw' && (
          <Panel pad={24}>
            <WithdrawPanel availableUsd={walletUsd ?? 0} onRefresh={refresh} />
          </Panel>
        )}
      </div>
    </TradingLayout>
  );
}
