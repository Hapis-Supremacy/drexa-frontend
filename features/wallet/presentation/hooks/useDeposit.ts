import { useState, useCallback, useEffect } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { api } from '@/lib/api';

/* Module level — never inside a component. `.catch` keeps a blocked/failed
   script load (ad-blocker, offline, etc.) from surfacing as an unhandled
   rejection; <Elements stripe={null}> just renders without a payment form. */
export const stripePromise: Promise<Stripe | null> | null = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).catch(() => null)
  : null;

export type DepositStep = 'amount' | 'payment' | 'confirming' | 'success' | 'error';

interface UseDepositReturn {
  step: DepositStep;
  usdAmt: string;
  setUsdAmt: (v: string) => void;
  clientSecret: string | null;
  loading: boolean;
  errorMsg: string | null;
  dollars: number;
  valid: boolean;
  handleContinue: () => Promise<void>;
  handleSuccess: () => void;
  handleError: (msg: string) => void;
  goBackToAmount: () => void;
  reset: () => void;
}

export function useDeposit(onRefresh: () => void): UseDepositReturn {
  const [step, setStep] = useState<DepositStep>('amount');
  const [usdAmt, setUsdAmt] = useState('500');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const secret = params.get('payment_intent_client_secret');
    if (secret) {
      setClientSecret(secret);
      setStep('confirming');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const dollars = parseFloat(usdAmt) || 0;
  const valid = dollars >= 10;

  const handleContinue = useCallback(async () => {
    if (!valid || !stripePromise || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { client_secret } = await api.post<{ client_secret: string; tx_id: string }>(
        '/payments/deposit/intent',
        { amount: Math.round(dollars * 100) }
      );
      setClientSecret(client_secret);
      setStep('payment');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  }, [valid, loading, dollars]);

  const handleSuccess = useCallback(() => {
    setStep('success');
    onRefresh();
  }, [onRefresh]);

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setStep('error');
  }, []);

  const goBackToAmount = useCallback(() => {
    setClientSecret(null);
    setStep('amount');
  }, []);

  const reset = useCallback(() => {
    setStep('amount');
    setClientSecret(null);
    setErrorMsg(null);
  }, []);

  return {
    step, usdAmt, setUsdAmt, clientSecret, loading, errorMsg, dollars, valid,
    handleContinue, handleSuccess, handleError, goBackToAmount, reset,
  };
}
