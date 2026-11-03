import { useEffect, useState } from 'react';

import { tokenStorage } from '@/lib/auth/tokenStorage';

/** Bearer header for auth-gated media (a repair's fault photo). */
export function useAuthHeaders() {
  const [headers, setHeaders] = useState<Record<string, string>>();
  useEffect(() => {
    tokenStorage
      .getAccessToken()
      .then((t) => t && setHeaders({ Authorization: `Bearer ${t}` }))
      .catch(() => {});
  }, []);
  return headers;
}
