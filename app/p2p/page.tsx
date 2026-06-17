import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { P2PPage } from '@/features/p2p/presentation/pages/p2p_page';

export default function Page() {
  return (
    <AuthGuard>
      <P2PPage />
    </AuthGuard>
  );
}
