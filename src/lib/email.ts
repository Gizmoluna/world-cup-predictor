// ---------------------------------------------------------------------------
// Transactional email via Resend's REST API (no SDK dependency). Used for the
// password-reset flow. Degrades gracefully: with no RESEND_API_KEY it no-ops
// and reports sent:false, so the app never breaks — the reset link is still
// returned to the caller (and shown in dev) so testing works without a key.
// ---------------------------------------------------------------------------

import "server-only";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// A from-address Resend will accept out of the box (their shared sender) until a
// verified domain is set via EMAIL_FROM.
const DEFAULT_FROM = "World Cup Predictor <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: "email not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `resend ${res.status}: ${body.slice(0, 140)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export function resetEmailHtml(name: string, link: string): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h1 style="font-size:20px">⚽ World Cup Predictor</h1>
    <p>Hi ${name}, someone asked to reset your PIN.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#0a7d3d;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">
        Reset your PIN
      </a>
    </p>
    <p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn't ask for this, ignore this email — your account is safe.</p>
    <p style="color:#999;font-size:12px">${link}</p>
  </div>`;
}
