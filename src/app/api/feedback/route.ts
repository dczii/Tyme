import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PAYWALL_FEATURES, PRICE_BANDS } from "@/constants";
import type { FeedbackDraft } from "@/types";

/**
 * POST /api/feedback — emails a survey submission to the product owner.
 *
 * This is the only server-side code in the app. It exists because sending mail
 * needs a secret, and secrets cannot ship to the browser.
 *
 * Nothing is persisted: this email IS the submission. There is no `feedback`
 * table to fall back on, so a failed send means the response is lost — the client
 * surfaces that as an error and keeps the form filled rather than thanking the
 * user for a message that never left.
 *
 * Callers must present the Supabase access token of a signed-in user, so the
 * endpoint can't be used as an open relay by anyone who finds the URL. The
 * sender's name and email are read from that token, never from the request body.
 *
 * Required env (Vercel → Project Settings → Environment Variables):
 *   RESEND_API_KEY       server-only secret, no NEXT_PUBLIC_ prefix
 * Optional env:
 *   FEEDBACK_TO_EMAIL    default dczii@live.com
 *   FEEDBACK_FROM_EMAIL  default feedback@tymeapp.space — the domain must be
 *                        verified in Resend, or sends fail with a 403/502
 */

const TO_EMAIL = process.env.FEEDBACK_TO_EMAIL || "dczii@live.com";
const FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL || "Tyme Feedback <feedback@tymeapp.space>";

const FEATURE_LABELS = new Map(PAYWALL_FEATURES.map((f) => [f.id as string, f.label as string]));
const PRICE_LABELS = new Map(PRICE_BANDS.map((b) => [b.id as string, b.label as string]));

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(request: Request) {
  // 1. Authenticate the caller against Supabase.
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // 2. Validate the payload — never trust the shape the client sent.
  let draft: Partial<FeedbackDraft>;
  try {
    draft = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const kind = draft.kind === "review" || draft.kind === "features" ? draft.kind : null;
  if (!kind) {
    return NextResponse.json({ error: 'kind must be "review" or "features"' }, { status: 400 });
  }

  // Identity is taken from the verified token, never from the request body. The UI
  // shows these read-only, and trusting the body would let a hand-rolled request
  // point the owner's "Reply" at an address of the sender's choosing.
  const meta = userData.user.user_metadata ?? {};
  const name =
    String(meta.full_name || meta.name || "")
      .trim()
      .slice(0, 200) || "Anonymous";
  const email = (userData.user.email ?? "").trim().slice(0, 320);
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const review = String(draft.review ?? "").slice(0, 2000);
  const otherFeature = String(draft.otherFeature ?? "")
    .trim()
    .slice(0, 200);
  const rating = Number.isFinite(Number(draft.rating))
    ? Math.min(5, Math.max(0, Math.round(Number(draft.rating))))
    : 0;
  const features = Array.isArray(draft.features)
    ? draft.features.filter((f) => typeof f === "string" && FEATURE_LABELS.has(f)).slice(0, 20)
    : [];
  const priceBand =
    typeof draft.priceBand === "string" && PRICE_LABELS.has(draft.priceBand) ? draft.priceBand : "";

  if (kind === "review" && rating < 1) {
    return NextResponse.json({ error: "A review needs a rating of 1-5" }, { status: 400 });
  }
  if (kind === "features") {
    if (features.length === 0 && !otherFeature) {
      return NextResponse.json({ error: "Pick at least one feature" }, { status: 400 });
    }
    if (!priceBand) {
      return NextResponse.json({ error: "Pick a price band" }, { status: 400 });
    }
  }

  // 3. Compose the notification.
  const subject =
    kind === "review"
      ? `Tyme review — ${rating}/5 from ${name}`
      : `Tyme feature interest — ${name} (${PRICE_LABELS.get(priceBand) ?? "no price given"})`;

  const featureList = features.map((f) => FEATURE_LABELS.get(f) ?? f);
  const textLines = [
    `From: ${name} <${email}>`,
    `Account id: ${userData.user.id}`,
    `Type: ${kind === "review" ? "Review" : "Features they would pay for"}`,
    "",
    ...(kind === "review"
      ? [`Rating: ${rating}/5`, "", review || "(no written review)"]
      : [
          `Would pay for: ${featureList.length ? featureList.join(", ") : "(none selected)"}`,
          otherFeature ? `Also wants: ${otherFeature}` : "",
          `Willing to pay: ${PRICE_LABELS.get(priceBand) ?? "(not answered)"} per month`,
        ].filter(Boolean)),
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px">
      <h2 style="margin:0 0 4px">${kind === "review" ? "New review" : "New feature interest"}</h2>
      <p style="margin:0 0 16px;color:#666;font-size:13px">
        ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>
        <span style="color:#999">Verified account · ${escapeHtml(userData.user.id)}</span>
      </p>
      ${
        kind === "review"
          ? `<p style="font-size:20px;margin:0 0 12px">${"★".repeat(rating)}${"☆".repeat(5 - rating)}
             <span style="font-size:13px;color:#666">${rating}/5</span></p>
           <blockquote style="margin:0;padding:12px 16px;background:#f6f6f6;border-radius:8px;white-space:pre-wrap">${
             escapeHtml(review) || '<em style="color:#999">No written review</em>'
           }</blockquote>`
          : `<p style="margin:0 0 8px"><strong>Would pay for</strong></p>
           <ul style="margin:0 0 16px;padding-left:20px">${
             featureList.length
               ? featureList.map((f) => `<li>${escapeHtml(f)}</li>`).join("")
               : '<li style="color:#999">Nothing selected</li>'
           }</ul>
           ${otherFeature ? `<p style="margin:0 0 16px"><strong>Also wants:</strong> ${escapeHtml(otherFeature)}</p>` : ""}
           <p style="margin:0"><strong>Willing to pay:</strong> ${escapeHtml(
             PRICE_LABELS.get(priceBand) ?? "Not answered",
           )} / month</p>`
      }
    </div>`;

  // 4. Send it. A missing key is a configuration problem, not a user error —
  // report it distinctly so the client can still confirm the saved submission.
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY is not set — feedback email was not sent.");
    return NextResponse.json(
      { ok: false, emailed: false, reason: "not_configured" },
      { status: 200 },
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: replyTo,
        subject,
        text: textLines.join("\n"),
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend rejected the feedback email:", res.status, detail);
      return NextResponse.json(
        { ok: false, emailed: false, reason: "provider_error" },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Failed to reach the email provider:", err);
    return NextResponse.json(
      { ok: false, emailed: false, reason: "network_error" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, emailed: true });
}
