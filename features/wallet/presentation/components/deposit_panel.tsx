"use client";

import { useEffect, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { btnBrand, btnGhost, TIcon } from '@/features/core/presentation/components/primitives';
import { useDeposit, stripePromise } from '@/features/wallet/presentation/hooks/useDeposit';
import { LockedAsset, SellToUsdtNote } from './wallet_shared';

type PaymentFormProps = {
  clientSecret: string;
  isConfirming: boolean;
  onBack: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
};

function PaymentForm({ clientSecret, isConfirming, onBack, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isConfirming || !stripe) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        onError('Could not retrieve payment status.');
        return;
      }

      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        onSuccess();
        return;
      }

      onError('Payment was not completed. Please try again.');
    });
  }, [clientSecret, isConfirming, onError, onSuccess, stripe]);

  if (isConfirming) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ font: 'var(--body)', color: 'var(--fg-3)' }}>Confirming your payment...</div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      return;
    }

    onSuccess();
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
          style={{
            ...btnBrand,
            flex: 2,
            opacity: (!stripe || !elements || submitting) ? 0.6 : 1,
            cursor: (!stripe || !elements || submitting) ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Processing...' : 'Pay now'}
        </button>
      </div>
    </form>
  );
}

export function DepositPanel({ onRefresh }: { onRefresh: () => void }) {
  const {
    step, usdAmt, setUsdAmt, clientSecret, loading, errorMsg, dollars, valid,
    handleContinue, handleSuccess, handleError, goBackToAmount, reset,
  } = useDeposit(onRefresh);

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
                onChange={event => setUsdAmt(event.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                inputMode="decimal"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--fg)',
                  font: '700 24px var(--font-num)', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[100, 500, 1000].map(value => (
                <button key={value} onClick={() => setUsdAmt(String(value))} style={{
                  flex: 1, padding: '8px 0', borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'var(--small)',
                  border: dollars === value ? '1px solid var(--brand-mint)' : '1px solid var(--border-subtle)',
                  background: dollars === value ? 'rgba(0,255,163,.08)' : 'var(--surface-input)',
                  color: dollars === value ? 'var(--fg)' : 'var(--fg-3)',
                }}>${value.toLocaleString()}</button>
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
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--small)' }}>
              <span style={{ color: 'var(--fg-3)' }}>{label}</span>
              <span style={{ color: 'var(--fg-2)' }}>{value}</span>
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
            {loading ? 'Loading...' : 'Continue to payment'}
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

  if ((step === 'payment' || step === 'confirming') && clientSecret && stripePromise) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ font: 'var(--h3)', color: 'var(--fg)', marginBottom: 20 }}>
          {step === 'confirming' ? 'Confirming payment...' : `Complete payment - $${parseFloat(usdAmt).toFixed(2)}`}
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
