import { useCallback, useEffect, useState } from 'react';
import pb from './pocketbase';

// Shared list-fetching behaviour for the Members/Groups/Events/Suivis/Donations
// screens: load once, expose pull-to-refresh, surface loading/error state.
export function useCollection(collectionName, { filter, sort, expand, perPage = 200 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const result = await pb.collection(collectionName).getList(1, perPage, {
          filter,
          sort,
          expand,
        });
        setItems(result.items);
      } catch (err) {
        if (!err?.isAbort) setError(err);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [collectionName, filter, sort, expand, perPage]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, refreshing, error, refresh: () => load(true), reload: () => load(false) };
}
