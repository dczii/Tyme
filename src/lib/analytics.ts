// Landing-page conversion funnel instrumentation (#32).
//
// One thin, typed wrapper over Vercel Analytics custom events so every call site
// speaks the same vocabulary and no payload can ever carry PII (no emails, names,
// or tokens — only the coarse panel/method labels below). `@vercel/analytics` is
// already mounted in the root layout and its endpoint is allowlisted in the CSP
// `connect-src`, so these fire with no extra wiring.
//
// The funnel these events measure, panel by panel:
//   cta_click {panel, variant} → signup_modal_open → signup_method {method}
//   → signup_submitted → signup_confirmed_return
// giving per-section drop-off from first tap to a confirmed return.

import { track } from '@vercel/analytics';

// Which panel a CTA lives on, so per-section conversion is measurable.
export type CtaPanel = 'hero' | 'proof' | 'pricing' | 'final' | 'mobile_bar' | 'header';

// primary = the copper "start tracking" action; secondary = the quiet anchor CTA.
export type CtaVariant = 'primary' | 'secondary';

// Which registration method the visitor committed to.
export type SignupMethod = 'google' | 'email';

/** A CTA was clicked. Tagged with its panel + variant for per-section drop-off. */
export function trackCtaClick(panel: CtaPanel, variant: CtaVariant): void {
  track('cta_click', { panel, variant });
}

/** The shared signup modal opened (via a CTA or the /?signup=1 deep link). */
export function trackSignupModalOpen(): void {
  track('signup_modal_open');
}

/** The visitor committed to a registration method (chose Google or email). */
export function trackSignupMethod(method: SignupMethod): void {
  track('signup_method', { method });
}

/** A registration request was actually dispatched (email submit / Google redirect). */
export function trackSignupSubmitted(method: SignupMethod): void {
  track('signup_submitted', { method });
}

/** A confirmation-link / OAuth return landed back on an auth screen, ready to sign in. */
export function trackSignupConfirmedReturn(): void {
  track('signup_confirmed_return');
}
