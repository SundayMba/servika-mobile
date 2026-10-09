import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Gates an action behind authentication. Call `guard(action)`: if the user is
 * signed in, the action runs immediately; otherwise the AuthPromptSheet is shown
 * (drive its `visible` from `promptVisible` and close it with `hidePrompt`).
 *
 * The gated action is remembered. When the guest becomes signed in while the
 * wall is up (Google sign-in happens on the same screen), the wall closes and
 * the action runs by itself, so the guest lands exactly where they were going.
 * Pass `onSignedIn` to the sheet so the Google button never navigates away.
 */
export function useAuthGate() {
  const { status } = useAuth();
  const [promptVisible, setPromptVisible] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const isAuthenticated = status === 'authenticated';

  const guard = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
      } else {
        pending.current = action;
        setPromptVisible(true);
      }
    },
    [isAuthenticated],
  );

  const hidePrompt = useCallback(() => {
    pending.current = null;
    setPromptVisible(false);
  }, []);

  /** The wall closed because the guest is now signed in: carry on with what they tried. */
  const onSignedIn = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    setPromptVisible(false);
    action?.();
  }, []);

  useEffect(() => {
    if (isAuthenticated && promptVisible) onSignedIn();
  }, [isAuthenticated, promptVisible, onSignedIn]);

  return { isAuthenticated, guard, promptVisible, hidePrompt, onSignedIn };
}
