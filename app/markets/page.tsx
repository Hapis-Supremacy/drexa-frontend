import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { MarketsPage } from '@/features/markets/presentation/pages/markets_page';

export default function Page() {
  return (
    <AuthGuard>
      <MarketsPage />
    </AuthGuard>
  );
}
