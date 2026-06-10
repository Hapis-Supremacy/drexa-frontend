"use client";

import { useRouter } from 'next/navigation';
import { CoinBadge, TIcon } from '@/features/core/presentation/components/primitives';

export function LockedAsset({ label }: { label: string }) {
  return (
    <div style={{ display: 'block' }}>
      <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', height: 52, marginTop: 6, padding: '0 14px', gap: 10,
        background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)' }}>
        <CoinBadge sym="USDT" size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 15px var(--font-sans)', color: 'var(--fg)' }}>USDT</div>
          <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>Tether</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          borderRadius: 'var(--r-pill)', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)',
          font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          USDT only
        </span>
      </div>
    </div>
  );
}

export function SellToUsdtNote({ action }: { action: 'deposit' | 'withdraw' }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
      borderRadius: 'var(--r-sm)', background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.18)' }}>
      <TIcon name="repeat" size={16} color="var(--brand-blue)" style={{ marginTop: 1 }} />
      <span style={{ font: 'var(--micro)', color: 'var(--fg-2)', lineHeight: 1.5 }}>
        Drexa settles in USDT only.{' '}
        {action === 'withdraw'
          ? 'To cash out BTC, ETH or any other holding, sell it to USDT on the Trade screen first, then withdraw.'
          : 'Buy USDT with cash here, then trade it for BTC, ETH or any other asset on the Trade screen.'
        }{' '}
        <button onClick={() => router.push('/trade')}
          style={{ border: 'none', background: 'none', padding: 0, color: 'var(--brand-mint)', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
          Open Trade
        </button>
      </span>
    </div>
  );
}
