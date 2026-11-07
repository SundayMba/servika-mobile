/**
 * Joins the same waitlist as the website form (servika.com.ng), from inside the app. The site
 * stores the email with source "app" and the customer's area, and sends one welcome email.
 * It is not our API, so this is a plain fetch with its own timeout.
 */
const WAITLIST_URL = 'https://www.servika.com.ng/api/waitlist';

export type WaitlistResult = { existing: boolean };

export async function joinWaitlist(email: string, area: string | null): Promise<WaitlistResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(WAITLIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'customer', source: 'app', area }),
      signal: ctrl.signal,
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; existing?: boolean; error?: string };
    if (!res.ok || !body.ok) throw new Error(body.error || 'Could not add you. Try again.');
    return { existing: !!body.existing };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('No connection. Try again.');
    if (e instanceof TypeError) throw new Error('No connection. Try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
