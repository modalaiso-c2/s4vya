import { useEffect } from 'react';
import { toast } from 'sonner';
import { syncPending } from '@/lib/offline/transactionQueue';

export const SYNC_EVENT = 'savya:synced';

export const OfflineSync = () => {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const synced = await syncPending();
      if (cancelled || synced === 0) return;
      toast.success(
        synced === 1 ? '1 transaction synchronisée' : `${synced} transactions synchronisées`
      );
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    };

    run();
    window.addEventListener('online', run);
    const interval = window.setInterval(run, 60000);

    return () => {
      cancelled = true;
      window.removeEventListener('online', run);
      window.clearInterval(interval);
    };
  }, []);

  return null;
};
