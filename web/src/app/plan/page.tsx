'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function PlanRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/studio'); }, [router]);
  return (
    <AppLayout title="推广工坊" subtitle="正在跳转…">
      <div className="h-full flex items-center justify-center text-sm text-zinc-400">
        正在跳转到推广工坊…
      </div>
    </AppLayout>
  );
}

