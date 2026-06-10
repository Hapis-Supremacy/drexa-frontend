"use client"

import React from 'react';
import {
  Search, Bell, BarChart2, Wallet, LayoutGrid, House, List,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, Shield, Info,
  ChevronDown, ChevronRight, Settings, Plus, ArrowLeftRight,
  Download, Upload, Copy, Check, CheckCircle, X, Clock, Calendar,
  Filter, ExternalLink, Repeat, TrendingUp, Eye, EyeOff, Zap,
  Gift, LogOut, DollarSign, CreditCard, Landmark, Smartphone, LucideProps,
} from 'lucide-react';
import type { CoinStyle } from '@/features/core/domain/model';
import { COIN_STYLE } from '@/features/core/domain/data/mock_data';
import { fmtPct } from '@/features/core/domain/data/trading_utils';

/* ── TIcon ──────────────────────────────────────────────────────── */
type IconName =
  | 'search' | 'bell' | 'chart' | 'wallet' | 'grid' | 'home' | 'list'
  | 'arrowUp' | 'arrowDown' | 'arrowLeft' | 'arrowRight' | 'star'
  | 'shield' | 'info' | 'chevDown' | 'chevRight' | 'settings' | 'plus'
  | 'arrowSwap' | 'download' | 'upload' | 'copy' | 'check' | 'checkCircle'
  | 'x' | 'clock' | 'calendar' | 'filter' | 'externalLink' | 'repeat'
  | 'trending' | 'eye' | 'eyeOff' | 'zap' | 'gift' | 'logout' | 'dollar'
  | 'card' | 'bank' | 'phone';

const ICON_MAP: Record<IconName, React.FC<LucideProps>> = {
  search: Search, bell: Bell, chart: BarChart2, wallet: Wallet,
  grid: LayoutGrid, home: House, list: List,
  arrowUp: ArrowUp, arrowDown: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight,
  star: Star, shield: Shield, info: Info,
  chevDown: ChevronDown, chevRight: ChevronRight,
  settings: Settings, plus: Plus, arrowSwap: ArrowLeftRight,
  download: Download, upload: Upload, copy: Copy, check: Check,
  checkCircle: CheckCircle, x: X, clock: Clock, calendar: Calendar,
  filter: Filter, externalLink: ExternalLink, repeat: Repeat,
  trending: TrendingUp, eye: Eye, eyeOff: EyeOff, zap: Zap,
  gift: Gift, logout: LogOut, dollar: DollarSign,
  card: CreditCard, bank: Landmark, phone: Smartphone,
};

export function TIcon({
  name,
  size = 18,
  color = 'currentColor',
  stroke = 2,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  style?: React.CSSProperties;
}) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return null;
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={stroke}
      style={{ flex: 'none', ...style }}
    />
  );
}

/* ── CoinBadge ──────────────────────────────────────────────────── */
export function CoinBadge({ sym, size = 34 }: { sym: string; size?: number }) {
  const s: CoinStyle = COIN_STYLE[sym] ?? { bg: '#2A3152', glyph: sym[0], fg: '#fff' };
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: s.bg, color: s.fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      font: `700 ${size * 0.46}px var(--font-sans)`,
    }}>
      {s.glyph}
    </span>
  );
}

/* ── Panel ──────────────────────────────────────────────────────── */
export function Panel({
  children,
  style,
  pad = 18,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--r-md)', padding: pad, ...style,
    }}>
      {children}
    </div>
  );
}

/* ── SectionTitle ───────────────────────────────────────────────── */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ font: 'var(--h3)', color: 'var(--fg)' }}>{children}</h2>
      {action}
    </div>
  );
}

/* ── Delta ──────────────────────────────────────────────────────── */
export function Delta({ v, size = 14, icon = false }: { v: number; size?: number; icon?: boolean }) {
  const up = v >= 0;
  const color = up ? 'var(--up)' : 'var(--down)';
  return (
    <span style={{
      color,
      font: `700 ${size}px var(--font-num)`,
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {icon && <TIcon name={up ? 'arrowUp' : 'arrowDown'} size={size - 2} stroke={2.6} />}
      {fmtPct(v)}
    </span>
  );
}

/* ── Pill ───────────────────────────────────────────────────────── */
type PillTone = 'up' | 'down' | 'warn' | 'neutral' | 'info';
const PILL_MAP: Record<PillTone, { c: string; bg: string }> = {
  up:      { c: 'var(--up)',         bg: 'var(--up-soft)' },
  down:    { c: 'var(--down)',       bg: 'var(--down-soft)' },
  warn:    { c: 'var(--warning)',    bg: 'rgba(251,214,11,.12)' },
  neutral: { c: 'var(--fg-3)',       bg: 'rgba(255,255,255,.06)' },
  info:    { c: 'var(--brand-blue)', bg: 'rgba(59,130,246,.14)' },
};
export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: PillTone }) {
  const s = PILL_MAP[tone] ?? PILL_MAP.neutral;
  return (
    <span style={{
      font: 'var(--nano)', color: s.c, background: s.bg,
      padding: '3px 9px', borderRadius: 'var(--r-pill)',
      textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

/* ── Sparkline ──────────────────────────────────────────────────── */
export function Sparkline({ data, up, w = 96, h = 30 }: { data: number[]; up: boolean; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const col = up ? 'var(--up)' : 'var(--down)';
  const min = Math.min(...data), max = Math.max(...data), rng_ = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / rng_) * h}`).join(' ');
  const id = 'sg' + Math.round(data[0] * 1000) + (up ? 'u' : 'd');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.28" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/* ── AreaChart ──────────────────────────────────────────────────── */
export function AreaChart({
  data, up = true, height = 220, style = 'area', showAxis = true, fillId,
}: {
  data: number[];
  up?: boolean;
  height?: number;
  style?: 'area' | 'line';
  showAxis?: boolean;
  fillId?: string;
}) {
  if (data.length < 2) return null;
  const W = 1000, H = height;
  const min = Math.min(...data), max = Math.max(...data), span = (max - min) || 1;
  const pad = span * 0.12;
  const lo = min - pad, hi = max + pad, vspan = hi - lo;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / vspan) * H;
  const line = data.map((d, i) => `${x(i)},${y(d)}`).join(' ');
  const col = up ? 'var(--up)' : 'var(--down)';
  const id = fillId ?? ('ac' + Math.round(data[0]) + (up ? 'u' : 'd'));
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={col} stopOpacity={style === 'area' ? 0.30 : 0.14} />
            <stop offset="1" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showAxis && Array.from({ length: 4 }).map((_, i) => (
          <line key={i} x1="0" y1={(H / 3) * i} x2={W} y2={(H / 3) * i} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
        ))}
        {style !== 'line' && <polygon points={`0,${H} ${line} ${W},${H}`} fill={`url(#${id})`} />}
        <polyline points={line} fill="none" stroke={col} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Shared button/table style constants ────────────────────────── */
export const btnBrand: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44,
  padding: '0 18px', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer',
  font: 'var(--body-strong)', background: 'var(--brand-gradient)', color: '#0b1020',
};
export const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44,
  padding: '0 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)',
  cursor: 'pointer', font: 'var(--small)', background: 'transparent', color: 'var(--fg)',
};
export const linkBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 2, border: 'none', background: 'none',
  cursor: 'pointer', font: 'var(--small)', color: 'var(--brand-mint)',
};
export const thL: React.CSSProperties = {
  textAlign: 'left', padding: 'var(--cell-py,13px) 18px', font: 'var(--nano)',
  color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600,
};
export const thR: React.CSSProperties = { ...thL, textAlign: 'right' };
export const tdL: React.CSSProperties = { textAlign: 'left', padding: 'var(--cell-py,14px) 18px' };
export const tdR: React.CSSProperties = {
  textAlign: 'right', padding: 'var(--cell-py,14px) 18px',
  font: '500 14px var(--font-num)', fontVariantNumeric: 'tabular-nums',
};
