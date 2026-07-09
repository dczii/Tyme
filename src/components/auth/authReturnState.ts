// Registration ends off-page — a Google redirect or a confirmation-email link —
// and those returns land back on an auth screen carrying their outcome in the URL.
// This reads that outcome so LoginScreen can greet the user with a clear next step
// instead of a silent, contextless form (Milestone 3, #28).
//
// Supabase puts OAuth errors and the email-confirmation `type` in either the query
// string (`?error=…`) or the hash fragment (`#error=…&type=signup`) depending on the
// flow, so we check both.

export interface AuthReturnState {
  kind: 'error' | 'confirmed';
  message: string;
}

export function readAuthReturnState(): AuthReturnState | null {
  if (typeof window === 'undefined') return null;

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const get = (key: string) => search.get(key) || hash.get(key);

  const errorCode = get('error') || get('error_code');
  if (errorCode) {
    const denied = errorCode === 'access_denied';
    const rawDesc = get('error_description');
    const desc = rawDesc ? decodeURIComponent(rawDesc.replace(/\+/g, ' ')) : '';
    return {
      kind: 'error',
      message: denied
        ? 'Google sign-in was cancelled. You can try again whenever you’re ready.'
        : desc || 'Sign-in didn’t complete. Please try again.',
    };
  }

  // `type=signup` is appended to `emailRedirectTo` when a confirmation link is
  // followed. The link usually establishes a session on its own; this banner covers
  // the case where the user still lands on the sign-in form.
  if (get('type') === 'signup') {
    return { kind: 'confirmed', message: 'Email confirmed — you can sign in now.' };
  }

  return null;
}
