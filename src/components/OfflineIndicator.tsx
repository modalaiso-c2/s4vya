import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { subscribePending } from '@/lib/offline/transactionQueue';

export const OfflineIndicator = () => {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribePending(setPending);
    return () => {
      unsubscribe();
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <span
      title={
        online
          ? `${pending} modification(s) en cours de synchronisation`
          : 'Hors ligne — vos modifications seront synchronisées automatiquement'
      }
      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ${
        online ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'
      }`}
    >
      {online ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CloudOff className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">{online ? 'Synchronisation…' : 'Hors ligne'}</span>
      {pending > 0 && <span>{pending}</span>}
    </span>
  );
};
