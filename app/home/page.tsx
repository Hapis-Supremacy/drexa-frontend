import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { HomePage } from '@/features/home/presentation/pages/home_page';

export default function Page() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}
