import { AuthGuard } from '@/features/auth/presentation/components/auth_guard';
import { AssetPage } from '@/features/markets/presentation/pages/asset_page';

export default async function Page({ params }: { params: Promise<{ sym: string }> }) {
  const { sym } = await params;
  return (
    <AuthGuard>
      <AssetPage sym={sym} />
    </AuthGuard>
  );
}
