import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Shared list-fetching behaviour for the Members/Groups/Events/Suivis/Donations
// screens: load once, expose pull-to-refresh, surface loading/error state.
// `sort` keeps the PocketBase-style "-column" (descending) / "column"
// (ascending) string so call sites didn't need to change; `select` is
// passed straight through to Supabase (default '*', or e.g.
// '*, membre_id(name)' to embed a related row).
export function useCollection(table, { select = '*', sort, perPage = 200 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        let query = supabase.from(table).select(select).limit(perPage);
        if (sort) {
          const ascending = !sort.startsWith('-');
          const column = ascending ? sort : sort.slice(1);
          query = query.order(column, { ascending });
        }
        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        setItems(data || []);
      } catch (err) {
        setError(err);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [table, select, sort, perPage]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, refreshing, error, refresh: () => load(true), reload: () => load(false) };
}
