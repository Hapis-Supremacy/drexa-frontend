import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { PortfolioPage } from '@/features/portfolio/presentation/pages/portfolio_page';

export default function Page() {
  return (
    <AuthGuard>
      <PortfolioPage />
    </AuthGuard>
  );
}
