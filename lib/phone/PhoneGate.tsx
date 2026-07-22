import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import { VerifyPhoneSheet } from '@/components/VerifyPhoneSheet';
import { isPhoneVerificationRequired } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

type PhoneGateValue = {
  /**
   * If <paramref name="error"/> is the server's "verify your phone first" 403,
   * opens the phone-verify sheet and runs <paramref name="retry"/> after a
   * successful verification. Returns true when it handled the error (the caller
   * should stop), false otherwise (the caller handles the error normally).
   */
  handle: (error: unknown, retry: () => void) => boolean;
};

const PhoneGateContext = createContext<PhoneGateValue | null>(null);

/**
 * App-level phone-verification gate. Any action the server may reject with a
 * "phone_verification_required" 403 (booking, contacting an artisan) routes its
 * error here; the single sheet handles verification and re-runs the action. The
 * gate is server-driven — it only ever appears when the backend policy is on, so
 * this stays dormant until `Auth:RequirePhoneForBooking` is enabled.
 */
export function PhoneGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const retryRef = useRef<(() => void) | null>(null);

  const handle = useCallback((error: unknown, retry: () => void) => {
    if (!isPhoneVerificationRequired(error)) return false;
    retryRef.current = retry;
    setOpen(true);
    return true;
  }, []);

  const close = () => {
    setOpen(false);
    retryRef.current = null;
  };

  return (
    <PhoneGateContext.Provider value={{ handle }}>
      {children}
      <VerifyPhoneSheet
        visible={open}
        phoneNumber={user?.phoneNumber ?? ''}
        onClose={close}
        onVerified={() => {
          setOpen(false);
          const retry = retryRef.current;
          retryRef.current = null;
          retry?.();
        }}
      />
    </PhoneGateContext.Provider>
  );
}

export function usePhoneGate() {
  const ctx = useContext(PhoneGateContext);
  if (!ctx) throw new Error('usePhoneGate must be used within PhoneGateProvider');
  return ctx;
}
