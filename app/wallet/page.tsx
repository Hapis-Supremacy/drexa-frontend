import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { WalletPage } from '@/features/wallet/presentation/pages/wallet_page';

export default function Page() {
  return (
    <AuthGuard>
      <WalletPage />
    </AuthGuard>
  );
}
