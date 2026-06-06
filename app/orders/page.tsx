import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { OrdersPage } from '@/features/orders/presentation/pages/orders_page';

export default function Page() {
  return (
    <AuthGuard>
      <OrdersPage />
    </AuthGuard>
  );
}
