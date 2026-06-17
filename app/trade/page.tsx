import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { TradePage } from '@/features/trade/presentation/pages/trade_page';

export default async function Page({ searchParams }: { searchParams: Promise<{ sym?: string }> }) {
  const { sym } = await searchParams;
  return (
    <AuthGuard>
      <TradePage sym={sym ?? 'BTC'} />
    </AuthGuard>
  );
}
