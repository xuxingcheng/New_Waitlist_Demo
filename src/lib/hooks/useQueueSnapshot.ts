"use client";

import { useCallback, useEffect, useState } from "react";
import { queueRepository } from "@/lib/db/mockQueueRepository";
import type { QueueSnapshot } from "@/lib/db/types";

export function useQueueSnapshot(pollMs = 1500) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextSnapshot = await queueRepository.getSnapshot();
      setSnapshot(nextSnapshot);
      setError(null);
      return nextSnapshot;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to refresh queue data.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const runAction = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      try {
        const result = await action();
        await refresh();
        setError(null);
        return result;
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Action could not be completed.";
        setError(message);
        return null;
      }
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, pollMs);

    const handleStorage = () => {
      void refresh();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [pollMs, refresh]);

  return {
    snapshot,
    loading,
    error,
    refresh,
    runAction
  };
}
