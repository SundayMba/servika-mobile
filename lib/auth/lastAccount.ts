import * as SecureStore from 'expo-secure-store';

const KEY = 'servika.lastAccount';

/**
 * Who signed in on this phone last. Lets the sign-in screen open the short
 * way back in (face, name, email already filled) instead of a blank form.
 * Stored in SecureStore like the session; cleared with "Not you?".
 */
export type LastAccount = { fullName: string; email: string; lastSeenUtc: string };

export async function getLastAccount(): Promise<LastAccount | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as LastAccount) : null;
  } catch {
    return null;
  }
}

export async function setLastAccount(account: { fullName: string; email: string }): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify({ ...account, lastSeenUtc: new Date().toISOString() }));
  } catch {
    // best effort
  }
}

export async function clearLastAccount(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // best effort
  }
}

/** "Last here in March" style label. */
export function lastSeenLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return 'Last here today';
  if (days === 1) return 'Last here yesterday';
  if (days < 7) return `Last here ${days} days ago`;
  return `Last here in ${d.toLocaleDateString('en-NG', { month: 'long' })}`;
}
