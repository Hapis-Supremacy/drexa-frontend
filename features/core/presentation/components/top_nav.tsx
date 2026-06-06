"use client"

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { TIcon, btnGhost } from './primitives';
import { portfolioTotals } from '@/features/core/domain/data/mock_data';
import { fmtUSD } from '@/features/core/domain/data/trading_utils';

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      icon: 'home'   as const, href: '/home'      },
  { id: 'markets',   label: 'Markets',   icon: 'grid'   as const, href: '/markets'   },
  { id: 'trade',     label: 'Trade',     icon: 'chart'  as const, href: '/trade'     },
  { id: 'portfolio', label: 'Portfolio', icon: 'wallet' as const, href: '/portfolio' },
  { id: 'wallet',    label: 'Wallet',    icon: 'dollar' as const, href: '/wallet'    },
  { id: 'orders',    label: 'Orders',    icon: 'list'   as const, href: '/orders'    },
];

function activeId(pathname: string): string {
  if (pathname.startsWith('/markets')) return 'markets';
  if (pathname.startsWith('/trade'))   return 'trade';
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/wallet'))  return 'wallet';
  if (pathname.startsWith('/orders'))  return 'orders';
  return 'home';
}

export function TopNav() {
  const router  = useRouter();
  const pathname = usePathname();
  const active  = activeId(pathname);
  const bal     = portfolioTotals().value;

  const onLogout = async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    router.replace('/login');
  };

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', gap: 22, padding: '0 24px',
      borderBottom: '1px solid var(--border-hairline)', background: 'rgba(13,15,28,.72)',
      backdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <Image
        src="/assets/logo.png"
        alt="Drexa"
        width={90}
        height={26}
        style={{ height: 26, width: 'auto', cursor: 'pointer', objectFit: 'contain' }}
        onClick={() => router.push('/home')}
      />

      <nav style={{ display: 'flex', gap: 2 }}>
        {NAV_ITEMS.map(it => {
          const on = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => router.push(it.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px',
                borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                background: on ? 'var(--surface-raised)' : 'transparent',
                color: on ? 'var(--fg)' : 'var(--fg-3)', font: 'var(--small)',
                transition: 'color .15s, background .15s',
              }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-2)'; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-3)'; }}
            >
              <TIcon name={it.icon} size={17} color={on ? 'var(--brand-mint)' : 'currentColor'} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px',
        background: 'var(--surface-input)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-sm)', color: 'var(--fg-3)', width: 200,
      }}>
        <TIcon name="search" size={16} />
        <span style={{ font: 'var(--small)' }}>Search markets…</span>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ font: 'var(--nano)', color: 'var(--fg-4)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Balance</div>
        <div style={{ font: '700 15px var(--font-num)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{fmtUSD(bal)}</div>
      </div>

      <button
        onClick={() => router.push('/wallet')}
        style={{ ...btnGhost, height: 38, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 7 }}
      >
        <TIcon name="plus" size={15} color="var(--brand-mint)" />Deposit
      </button>

      <TIcon name="bell" size={20} color="var(--fg-3)" style={{ cursor: 'pointer' }} />

      <button
        onClick={onLogout}
        title="Log out"
        style={{
          ...btnGhost,
          width: 38,
          height: 38,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TIcon name="logout" size={17} color="var(--fg-3)" />
      </button>

      <span style={{
        width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: '700 14px var(--font-sans)', color: '#0b1020', cursor: 'pointer',
      }}>
        MJ
      </span>
    </header>
  );
}
