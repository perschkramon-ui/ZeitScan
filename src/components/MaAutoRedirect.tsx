"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MaAutoRedirect() {
  const router = useRouter();

  useEffect(() => {
    const maId = localStorage.getItem('maEmployeeId');
    if (maId) {
      router.replace(`/ma/${maId}`);
    }
  }, [router]);

  return null;
}
