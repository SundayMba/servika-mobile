import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Gates an action behind authentication. Call `guard(action)`: if the user is
 * signed in, the action runs immediately; otherwise the AuthPromptSheet is shown
 * (drive its `visible` from `promptVisible` and close it with `hidePrompt`).
 *
 * Lets the same screens that already render an AuthPromptSheet unlock their
 * gated actions (booking, chat, …) the moment the user is logged in.
 */
export function useAuthGate() {
  const { status } = useAuth();
  const [promptVisible, setPromptVisible] = useState(false);

  const isAuthenticated = status === 'authenticated';

  const guard = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
      } else {
        setPromptVisible(true);
      }
    },
    [isAuthenticated],
  );

  const hidePrompt = useCallback(() => setPromptVisible(false), []);

  return { isAuthenticated, guard, promptVisible, hidePrompt };
}
