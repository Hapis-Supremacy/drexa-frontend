"use client"

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { TradingLayout } from '@/features/core/presentation/components/trading_layout';
import {
  TIcon, CoinBadge, Panel,
  btnBrand, btnGhost, thL, thR, tdL, tdR,
} from '@/features/core/presentation/components/primitives';
import { NETWORKS, holdingRows } from '@/features/core/domain/data/mock_data';
import { fmtUSD, fmtNum } from '@/features/core/domain/data/trading_utils';
import { api } from '@/lib/api';
import { useDeposit, stripePromise } from '@/features/wallet/presentation/hooks/useDeposit';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Transaction {
  TxID: string;
  Type: 'deposit' | 'withdrawal';
  Amount: number;
  Currency: string;
  Status: 'pending' | 'completed' | 'failed';
  CreatedAt: string;
}

/* ── Locked USDT asset display ──────────────────────────────────────────── */
function LockedAsset({ label }: { label: string }) {
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

/* ── "Sell to USDT first" note ──────────────────────────────────────────── */
function SellToUsdtNote({ action }: { action: 'deposit' | 'withdraw' }) {
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
          Open Trade →
        </button>
      </span>
    </div>
  );
}

/* ── Stripe payment form (must render inside <Elements>) ────────────────── */
function PaymentForm({ clientSecret, isConfirming, onBack, onSuccess, onError }: {
  clientSecret: string;
  isConfirming: boolean;
  onBack: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isConfirming || !stripe) return;
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) { onError('Could not retrieve payment status.'); return; }
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        onSuccess();
      } else {
        onError('Payment was not completed. Please try again.');
      }
    });
  }, [isConfirming, stripe, clientSecret, onSuccess, onError]);

  if (isConfirming) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ font: 'var(--body)', color: 'var(--fg-3)' }}>Confirming your payment…</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/wallet` },
      redirect: 'if_required',
    });
    if (error) {
      onError(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PaymentElement />
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onBack} style={{ ...btnGhost, flex: 1 }}>
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          style={{ ...btnBrand, flex: 2, opacity: (!stripe || !elements || submitting) ? 0.6 : 1, cursor: (!stripe || !elements || submitting) ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Processing…' : 'Pay now'}
        </button>
      </div>
    </form>
  );
}

/* ── Deposit panel ──────────────────────────────────────────────────────── */
function DepositPanel({ onRefresh }: { onRefresh: () => void }) {
  const {
    step, usdAmt, setUsdAmt, clientSecret, loading, errorMsg, dollars, valid,
    handleContinue, handleSuccess, handleError, goBackToAmount, reset,
  } = useDeposit(onRefresh);

  /* ── Amount step ── */
  if (step === 'amount') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LockedAsset label="You buy" />
          <div>
            <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>You pay (USD)</span>
            <div style={{ display: 'flex', alignItems: 'center', height: 64, marginTop: 6, padding: '0 14px', gap: 8,
              background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)' }}>
              <span style={{ font: '700 22px var(--font-num)', color: 'var(--fg-3)' }}>$</span>
              <input
                value={usdAmt}
                onChange={e => setUsdAmt(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                inputMode="decimal"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)',
                  font: '700 24px var(--font-num)', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[100, 500, 1000].map(v => (
                <button key={v} onClick={() => setUsdAmt(String(v))} style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'var(--small)',
                  border: dollars === v ? '1px solid var(--brand-mint)' : '1px solid var(--border-subtle)',
                  background: dollars === v ? 'rgba(0,255,163,.08)' : 'var(--surface-input)',
                  color: dollars === v ? 'var(--fg)' : 'var(--fg-3)',
                }}>${v.toLocaleString()}</button>
              ))}
            </div>
          </div>
          <SellToUsdtNote action="deposit" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 22,
          background: 'var(--surface-input)', borderRadius: 'var(--r-md)', alignSelf: 'start' }}>
          <div style={{ font: 'var(--small)', color: 'var(--fg)', fontWeight: 700 }}>Order summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '14px 0', borderRadius: 'var(--r-sm)', background: 'var(--bg-base)' }}>
            <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>You receive</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ font: '800 30px var(--font-num)', color: 'var(--up)', fontVariantNumeric: 'tabular-nums' }}>{dollars.toFixed(2)}</span>
              <span style={{ font: '700 16px var(--font-sans)', color: 'var(--fg-2)' }}>USD</span>
            </div>
          </div>
          {([
            ['Amount', `$${dollars.toFixed(2)}`],
            ['Processing fee', 'Included'],
            ['Payment via', 'Stripe'],
          ] as [string, string][]).map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--small)' }}>
              <span style={{ color: 'var(--fg-3)' }}>{k}</span>
              <span style={{ color: 'var(--fg-2)' }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--small)', color: 'var(--fg-2)' }}>Total charged</span>
            <span style={{ font: '700 16px var(--font-num)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>${dollars.toFixed(2)}</span>
          </div>
          {errorMsg && (
            <div style={{ font: 'var(--small)', color: 'var(--down)', padding: '8px 12px', background: 'var(--down-soft)', borderRadius: 'var(--r-sm)' }}>
              {errorMsg}
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={!valid || loading || !stripePromise}
            style={{ ...btnBrand, width: '100%', height: 48, marginTop: 4, opacity: (valid && !loading) ? 1 : 0.5, cursor: (valid && !loading) ? 'pointer' : 'not-allowed' }}
          >
            <TIcon name="card" size={16} color="#0b1020" />
            {loading ? 'Loading…' : 'Continue to payment'}
          </button>
          {!valid && (
            <div style={{ font: 'var(--nano)', color: 'var(--fg-3)', textAlign: 'center' }}>
              Minimum deposit is $10.00
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <TIcon name="shield" size={14} color="var(--fg-4)" style={{ marginTop: 2 }} />
            <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', lineHeight: 1.5 }}>
              Payments are processed securely by Stripe. Funds are credited after confirmation.
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Payment / confirming step ── */
  if ((step === 'payment' || step === 'confirming') && clientSecret && stripePromise) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ font: 'var(--h3)', color: 'var(--fg)', marginBottom: 20 }}>
          {step === 'confirming' ? 'Confirming payment…' : `Complete payment — $${parseFloat(usdAmt).toFixed(2)}`}
        </div>
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#00ffa3' } } }}
        >
          <PaymentForm
            clientSecret={clientSecret}
            isConfirming={step === 'confirming'}
            onBack={goBackToAmount}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </Elements>
      </div>
    );
  }

  /* ── Success step ── */
  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--up-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <TIcon name="checkCircle" size={32} color="var(--up)" />
        </div>
        <div style={{ font: 'var(--h2)', color: 'var(--fg)', marginBottom: 8 }}>Payment successful!</div>
        <div style={{ font: 'var(--body)', color: 'var(--fg-3)', marginBottom: 24 }}>
          Your account balance will update shortly.
        </div>
        <button onClick={() => { reset(); setUsdAmt('500'); }} style={{ ...btnBrand, margin: '0 auto' }}>
          Make another deposit
        </button>
      </div>
    );
  }

  /* ── Error step ── */
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--down-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <TIcon name="x" size={32} color="var(--down)" />
      </div>
      <div style={{ font: 'var(--h2)', color: 'var(--fg)', marginBottom: 8 }}>Payment failed</div>
      <div style={{ font: 'var(--body)', color: 'var(--fg-3)', marginBottom: 24 }}>
        {errorMsg ?? 'Something went wrong. Please try again.'}
      </div>
      <button onClick={reset} style={{ ...btnBrand, margin: '0 auto' }}>
        Try again
      </button>
    </div>
  );
}

/* ── Withdraw panel ─────────────────────────────────────────────────────── */
function WithdrawPanel({ availableUsd, onRefresh }: { availableUsd: number; onRefresh: () => void }) {
  const sym = 'USDT';
  const nets = NETWORKS[sym] ?? ['Default'];
  const [network, setNetwork] = useState(nets[0]);
  const [amt, setAmt] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => { setNetwork((NETWORKS[sym] ?? ['Default'])[0]); }, []);

  const n = parseFloat(amt) || 0;
  const valid = n >= 10 && n <= availableUsd;

  const handleWithdraw = async () => {
    if (!valid || withdrawStatus === 'loading') return;
    setWithdrawStatus('loading');
    setErrorMsg(null);
    try {
      await api.post('/payments/withdraw', { amount: Math.round(n * 100) });
      setWithdrawStatus('success');
      setAmt('');
      onRefresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Withdrawal failed. Please try again.');
      setWithdrawStatus('error');
    }
  };

  if (withdrawStatus === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--up-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <TIcon name="checkCircle" size={32} color="var(--up)" />
        </div>
        <div style={{ font: 'var(--h2)', color: 'var(--fg)', marginBottom: 8 }}>Withdrawal submitted!</div>
        <div style={{ font: 'var(--body)', color: 'var(--fg-3)', marginBottom: 24 }}>
          Your funds will be processed within 1–3 business days.
        </div>
        <button onClick={() => setWithdrawStatus('idle')} style={{ ...btnBrand, margin: '0 auto' }}>
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
            {nets.map(nw => (
              <button key={nw} onClick={() => setNetwork(nw)} style={{
                padding: '9px 14px', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'var(--small)',
                border: network === nw ? '1px solid var(--brand-mint)' : '1px solid var(--border-subtle)',
                background: network === nw ? 'rgba(0,255,163,.08)' : 'var(--surface-input)',
                color: network === nw ? 'var(--fg)' : 'var(--fg-3)',
              }}>{nw}</button>
            ))}
          </div>
        </div>

        <label style={{ display: 'block' }}>
          <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount (USD)</span>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, marginTop: 6, padding: '0 14px', gap: 8,
            background: 'var(--surface-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)' }}>
            <span style={{ font: '700 16px var(--font-num)', color: 'var(--fg-3)' }}>$</span>
            <input value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)', font: '600 15px var(--font-num)', fontVariantNumeric: 'tabular-nums', minWidth: 0 }} />
            <button onClick={() => setAmt(availableUsd.toFixed(2))}
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
          ['Amount', n ? `$${fmtNum(n, 2)}` : '—'],
          ['Network', network],
          ['Minimum', '$10.00'],
        ] as [string, string][]).map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--small)' }}>
            <span style={{ color: 'var(--fg-3)' }}>{k}</span>
            <span style={{ color: 'var(--fg-2)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ font: 'var(--small)', color: 'var(--fg-2)' }}>You will receive</span>
          <span style={{ font: '700 16px var(--font-num)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{n ? `$${fmtNum(n, 2)}` : '—'}</span>
        </div>
        {errorMsg && (
          <div style={{ font: 'var(--small)', color: 'var(--down)', padding: '8px 12px', background: 'var(--down-soft)', borderRadius: 'var(--r-sm)' }}>
            {errorMsg}
          </div>
        )}
        <button
          onClick={handleWithdraw}
          disabled={!valid || withdrawStatus === 'loading'}
          style={{ ...btnBrand, width: '100%', height: 48, marginTop: 4, opacity: (!valid || withdrawStatus === 'loading') ? 0.5 : 1, cursor: (!valid || withdrawStatus === 'loading') ? 'not-allowed' : 'pointer' }}
        >
          <TIcon name="upload" size={16} color="#0b1020" />
          {withdrawStatus === 'loading' ? 'Processing…' : `Withdraw ${sym}`}
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <TIcon name="shield" size={14} color="var(--fg-4)" style={{ marginTop: 2 }} />
          <span style={{ font: 'var(--nano)', color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Withdrawals are processed within 1–3 business days. Double-check the address — on-chain transfers cannot be reversed.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── WalletPage ─────────────────────────────────────────────────────────── */
const miniBtn: React.CSSProperties = {
  padding: '6px 13px', borderRadius: 'var(--r-xs)', border: '1px solid var(--border-subtle)',
  background: 'transparent', color: 'var(--fg-2)', font: 'var(--micro)', cursor: 'pointer',
};
const miniBtnBrand: React.CSSProperties = {
  padding: '6px 13px', borderRadius: 'var(--r-xs)', border: '1px solid rgba(0,255,163,.35)',
  background: 'rgba(0,255,163,.08)', color: 'var(--brand-mint)', font: 'var(--micro)', fontWeight: 700, cursor: 'pointer',
};

export function WalletPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const rows = useMemo(holdingRows, []);

  const [walletBalanceCents, setWalletBalanceCents] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await api.get<{ balance: number; currency: string }>('/wallet/balance');
      setWalletBalanceCents(data.balance);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const txns = await api.get<Transaction[]>('/wallet/transactions?limit=20&offset=0');
      setTransactions(txns ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  // Switch to deposit tab if returning from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_intent_client_secret')) {
      setTab('deposit');
    }
  }, []);

  const walletUsd = walletBalanceCents !== null ? walletBalanceCents / 100 : null;
  const tabs: [string, string][] = [['overview', 'Overview'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw']];

  return (
    <TradingLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 56px' }}>
        <h1 style={{ font: 'var(--h1)', color: 'var(--fg)', letterSpacing: '-.01em', marginBottom: 20 }}>Wallet</h1>

        {/* summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 22 }}>
          <Panel style={{ background: 'var(--surface-card)' }}>
            <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Cash balance</div>
            <div style={{ font: '800 26px var(--font-num)', color: 'var(--fg)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {walletUsd !== null ? fmtUSD(walletUsd) : '—'}
            </div>
          </Panel>
          <Panel>
            <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Portfolio value</div>
            <div style={{ font: '800 26px var(--font-num)', color: 'var(--up)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {fmtUSD(rows.reduce((a, r) => a + r.value, 0))}
            </div>
          </Panel>
          <Panel>
            <div style={{ font: 'var(--small)', color: 'var(--fg-3)' }}>Transactions</div>
            <div style={{ font: '800 26px var(--font-num)', color: 'var(--warning)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {transactions.length}
            </div>
          </Panel>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {tabs.map(([id, l]) => (
            <button key={id} onClick={() => setTab(id as typeof tab)} style={{
              padding: '9px 18px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', font: 'var(--small)',
              background: tab === id ? 'var(--surface-raised)' : 'transparent',
              color: tab === id ? 'var(--fg)' : 'var(--fg-3)',
            }}>{l}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            {/* Holdings table */}
            <Panel pad={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={thL}>Asset</th><th style={thR}>Total</th><th style={thR}>Available</th>
                  <th style={thR}>In orders</th><th style={thR}>Value</th>
                  <th style={{ ...thR, width: 200 }}></th>
                </tr></thead>
                <tbody>
                  {rows.map(r => {
                    const locked = r.sym === 'BTC' || r.sym === 'ETH' ? r.qty * 0.18 : 0;
                    return (
                      <tr key={r.sym} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                        <td style={tdL}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CoinBadge sym={r.sym} size={32} />
                            <div>
                              <div style={{ font: '700 14px var(--font-sans)', color: 'var(--fg)' }}>{r.name}</div>
                              <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{r.sym}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdR, color: 'var(--fg)', fontWeight: 700 }}>{fmtNum(r.qty, r.qty < 1 ? 4 : 2)}</td>
                        <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtNum(r.qty - locked, r.qty < 1 ? 4 : 2)}</td>
                        <td style={{ ...tdR, color: locked ? 'var(--warning)' : 'var(--fg-4)' }}>{locked ? fmtNum(locked, 4) : '—'}</td>
                        <td style={{ ...tdR, color: 'var(--fg-2)' }}>{fmtUSD(r.value)}</td>
                        <td style={tdR}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {r.sym === 'USDT' ? (
                              <>
                                <button onClick={() => setTab('deposit')}  style={miniBtn}>Deposit</button>
                                <button onClick={() => setTab('withdraw')} style={miniBtn}>Withdraw</button>
                                <button onClick={() => router.push('/trade')} style={miniBtn}>Trade</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => router.push('/trade?sym=' + r.sym)} style={miniBtnBrand}>Sell to USDT</button>
                                <button onClick={() => router.push('/trade?sym=' + r.sym)} style={miniBtn}>Trade</button>
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

            {/* Transaction history */}
            {transactions.length > 0 && (
              <Panel pad={0} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px 12px', font: 'var(--h3)', color: 'var(--fg)' }}>Transaction history</div>
                {transactions.map(tx => {
                  const inflow = tx.Type === 'deposit';
                  const usd = tx.Amount / 100;
                  const date = new Date(tx.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const statusColor = tx.Status === 'completed' ? 'var(--up)' : tx.Status === 'failed' ? 'var(--down)' : 'var(--warning)';
                  return (
                    <div key={tx.TxID} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: '1px solid var(--border-hairline)' }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: inflow ? 'var(--up-soft)' : 'var(--down-soft)' }}>
                        <TIcon name={inflow ? 'arrowDown' : 'arrowUp'} size={15} color={inflow ? 'var(--up)' : 'var(--down)'} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: '700 13px var(--font-sans)', color: 'var(--fg)', textTransform: 'capitalize' }}>{tx.Type}</div>
                        <div style={{ font: 'var(--nano)', color: 'var(--fg-3)' }}>{date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ font: '700 13px var(--font-num)', color: inflow ? 'var(--up)' : 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                          {inflow ? '+' : '-'}{fmtUSD(usd)}
                        </div>
                        <div style={{ font: 'var(--nano)', color: statusColor, textTransform: 'capitalize' }}>{tx.Status}</div>
                      </div>
                    </div>
                  );
                })}
              </Panel>
            )}
          </>
        )}

        {tab === 'deposit' && (
          <Panel pad={24}>
            <DepositPanel onRefresh={() => { fetchBalance(); fetchTransactions(); }} />
          </Panel>
        )}

        {tab === 'withdraw' && (
          <Panel pad={24}>
            <WithdrawPanel availableUsd={walletUsd ?? 0} onRefresh={() => { fetchBalance(); fetchTransactions(); }} />
          </Panel>
        )}
      </div>
    </TradingLayout>
  );
}
