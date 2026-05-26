"use client";

import { useEffect } from 'react';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 Minuten

export function useAutoUpdate() {
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > STALE_THRESHOLD_MS) {
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
