"use client";

import { useState } from 'react';
import { NETWORKS } from '@/features/core/domain/data/mock_data';
import { fmtNum, fmtUSD } from '@/features/core/domain/data/trading_utils';
import { btnBrand, TIcon } from '@/features/core/presentation/components/primitives';
import { api } from '@/lib/api';
import { LockedAsset, SellToUsdtNote } from './wallet_shared';

type WithdrawPanelProps = {
  availableUsd: number;
  onRefresh: () => void;
};

export function WithdrawPanel({ availableUsd, onRefresh }: WithdrawPanelProps) {
  const sym = 'USDT';
  const networks = NETWORKS[sym] ?? ['Default'];
  const [network, setNetwork] = useState(networks[0]);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericAmount = parseFloat(amount) || 0;
  const valid = numericAmount >= 10 && numericAmount <= availableUsd && address.trim().length > 0;

  const handleWithdraw = async () => {
    if (!valid || status === 'loading') return;

    setStatus('loading');
    setErrorMsg(null);

    try {
      await api.post('/wallet/crypto/withdraw', {
        amount: Math.round(numericAmount * 100),
        currency: 'USDT',
        to_address: address.trim(),
      });
      setStatus('success');
      setAmount('');
      setAddress('');
      onRefresh();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Withdrawal failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--up-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <TIcon name="checkCircle" size={32} color="var(--up)" />
        </div>
        <div style={{ font: 'var(--h2)', color: 'var(--fg)', marginBottom: 8 }}>Withdrawal submitted!</div>
        <div style={{ font: 'var(--body)', color: 'var(--fg-3)', marginBottom: 24 }}>
          Your funds will be processed within 1-3 business days.
        </div>
        <button onClick={() => setStatus('idle')} style={{ ...btnBrand, margin: '0 auto' }}>
          Make another withdrawal
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <LockedAsset label="Asset" />

        <div>
          <div style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Network</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {networks.map(item => (
              <button key={item} onClick={() => setNetwork(item)} style={{
                padding: '9px 14px', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'var(--small)',
                border: network === item ? '1px solid var(--brand-mint)' : '1px solid var(--border-subtle)',
                background: network === item ? 'rgba(0,255,163,.08)' : 'var(--surface-input)',
                color: network === item ? 'var(--fg)' : 'var(--fg-3)',
              }}>{item}</button>
            ))}
          </div>
        </div>

        <label style={{ display: 'block' }}>
          <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Destination Address</span>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, marginTop: 6, padding: '0 14px', gap: 8,
            background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)' }}>
            <input
              value={address}
              onChange={event => setAddress(event.target.value)}
              placeholder="Enter USDT address or User ID"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', font: 'var(--body)', minWidth: 0 }}
            />
          </div>
        </label>

        <label style={{ display: 'block' }}>
          <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount (USDT)</span>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, marginTop: 6, padding: '0 14px', gap: 8,
            background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)' }}>
            <span style={{ font: '700 16px var(--font-num)', color: 'var(--fg-3)' }}>$</span>
            <input
              value={amount}
              onChange={event => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', font: '600 15px var(--font-num)', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
            />
            <button onClick={() => setAmount(availableUsd.toFixed(2))}
              style={{ border: 'none', background: 'none', color: 'var(--brand-mint)', font: 'var(--small)', cursor: 'pointer' }}>Max</button>
          </div>
          <div style={{ font: 'var(--micro)', color: 'var(--fg-3)', marginTop: 6 }}>
            Available: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtUSD(availableUsd)}</span>
          </div>
        </label>

        <SellToUsdtNote action="withdraw" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 22,
        background: 'var(--surface-input)', borderRadius: 'var(--r-md)', alignSelf: 'start' }}>
        <div style={{ font: 'var(--small)', color: 'var(--fg)', fontWeight: 700 }}>Transaction summary</div>
        {([
          ['Amount', numericAmount ? `$${fmtNum(numericAmount, 2)}` : '-'],
          ['Network', network],
          ['Minimum', '$10.00'],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--small)' }}>
            <span style={{ color: 'var(--fg-3)' }}>{label}</span>
            <span style={{ color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--small)', color: 'var(--fg-2)' }}>You will receive</span>
          <span style={{ font: '700 16px var(--font-num)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{numericAmount ? `$${fmtNum(numericAmount, 2)}` : '-'}</span>
        </div>
        {errorMsg && (
          <div style={{ font: 'var(--small)', color: 'var(--down)', padding: '8px 12px', background: 'var(--down-soft)', borderRadius: 'var(--r-sm)' }}>
            {errorMsg}
          </div>
        )}
        <button
          onClick={handleWithdraw}
          disabled={!valid || status === 'loading'}
          style={{ ...btnBrand, width: '100%', height: 48, marginTop: 4, opacity: (!valid || status === 'loading') ? 0.5 : 1, cursor: (!valid || status === 'loading') ? 'not-allowed' : 'pointer' }}
        >
          <TIcon name="upload" size={16} color="#0b1020" />
          {status === 'loading' ? 'Processing...' : `Withdraw ${sym}`}
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <TIcon name="shield" size={14} color="var(--fg-4)" style={{ marginTop: 2 }} />
          <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Withdrawals are processed within 1-3 business days. Double-check the address; transfers cannot be reversed.
          </span>
        </div>
      </div>
    </div>
  );
}
