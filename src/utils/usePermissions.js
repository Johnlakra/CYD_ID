// Multi-diocese platform — usePermissions() hook (Phase 3).
// Fetches the caller's flat permission-key list from GET /auth/me/permissions
// once per login and shares it module-wide, so any number of <Can> gates cost
// a single request. Legacy screens keep their existing role checks — this hook
// gates NEW UI only, and resolves to "no permissions" on any failure so a
// missing/older backend can never widen access.

import { useCallback, useEffect, useState } from 'react';
import { getMyPermissions } from '../api/platformApi';

let cachedKeys = null;
let inflight = null;

// Called from logout/login paths and tests; next hook mount refetches.
export const clearPermissionsCache = () => {
  cachedKeys = null;
  inflight = null;
};

const fetchKeys = () => {
  if (!inflight) {
    inflight = getMyPermissions()
      .then((res) => {
        cachedKeys =
          res && res.success && res.data && Array.isArray(res.data.permissions)
            ? res.data.permissions
            : [];
        return cachedKeys;
      })
      .catch(() => {
        cachedKeys = [];
        return cachedKeys;
      });
  }
  return inflight;
};

export const usePermissions = () => {
  const [keys, setKeys] = useState(cachedKeys);
  const [loading, setLoading] = useState(cachedKeys === null);

  useEffect(() => {
    let mounted = true;
    if (cachedKeys === null) {
      fetchKeys().then((resolved) => {
        if (mounted) {
          setKeys(resolved);
          setLoading(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const can = useCallback(
    (permKey) => Array.isArray(keys) && keys.includes(permKey),
    [keys]
  );

  return { permissions: keys || [], can, loading };
};
