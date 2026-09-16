import { supabase } from '@/integrations/supabase/client';
import { idbGet, idbSet } from './idb';

const QUEUE_KEY = 'pending-transactions';
const CACHE_KEY = 'cached-data';

export interface TransactionPayload {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  date: string;
  note: string;
}

export type QueueItem =
  | { op: 'insert'; id: string; payload: TransactionPayload }
  | { op: 'update'; id: string; payload: TransactionPayload }
  | { op: 'delete'; id: string };

export const isLocalId = (id: string) => id.startsWith('local-');
export const newLocalId = () => `local-${crypto.randomUUID()}`;

const listeners = new Set<(count: number) => void>();

const readQueue = async (): Promise<QueueItem[]> => (await idbGet<QueueItem[]>(QUEUE_KEY)) ?? [];

const writeQueue = async (items: QueueItem[]) => {
  await idbSet(QUEUE_KEY, items);
  listeners.forEach((l) => l(items.length));
};

export const getPendingCount = async () => (await readQueue()).length;

export const subscribePending = (listener: (count: number) => void) => {
  listeners.add(listener);
  getPendingCount().then(listener);
  return () => listeners.delete(listener);
};

export const enqueue = async (item: QueueItem) => {
  const queue = await readQueue();

  if (item.op === 'update') {
    const existing = queue.find((q) => q.op === 'insert' && q.id === item.id);
    if (existing && existing.op === 'insert') {
      existing.payload = item.payload;
      await writeQueue(queue);
      return;
    }
    const pendingUpdate = queue.find((q) => q.op === 'update' && q.id === item.id);
    if (pendingUpdate && pendingUpdate.op === 'update') {
      pendingUpdate.payload = item.payload;
      await writeQueue(queue);
      return;
    }
  }

  if (item.op === 'delete' && isLocalId(item.id)) {
    await writeQueue(queue.filter((q) => q.id !== item.id));
    return;
  }

  queue.push(item);
  await writeQueue(queue);
};

// Locally cached snapshot so pages render offline
export const cacheSnapshot = async (data: { transactions: unknown[]; categories: unknown[] }) =>
  idbSet(CACHE_KEY, data);

export const readSnapshot = async () =>
  idbGet<{ transactions: unknown[]; categories: unknown[] }>(CACHE_KEY);

export const syncPending = async (): Promise<number> => {
  if (!navigator.onLine) return 0;
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const remaining: QueueItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.op === 'insert') {
        const { id, ...row } = item.payload;
        const { error } = await supabase.from('transactions').insert(row);
        if (error) throw error;
      } else if (item.op === 'update') {
        const { id, user_id, ...row } = item.payload;
        const { error } = await supabase.from('transactions').update(row).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transactions').delete().eq('id', item.id);
        if (error) throw error;
      }
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return synced;
};
