// Shared transactional email via Resend (https://resend.com).
//
// Best-effort by design: callers should wrap calls in try/catch and never fail
// their main work (e.g. creating a booking) if email sending throws. If
// RESEND_API_KEY is not set, send*() no-ops — so the function is safe to deploy
// before you've added the key.
//
// Env:
//   RESEND_API_KEY  (required to actually send)
//   EMAIL_FROM      (optional; default 'RollWise <onboarding@resend.dev>')
//   APP_TIMEZONE    (optional; default 'UTC' — used to format the session time)
//   APP_URL         (optional; default 'http://localhost:5173' — for links)

export interface BookingEmailData {
  to: string;
  studentName: string;
  coachName: string;
  sessionTitle: string;
  startsAt: string; // ISO timestamp
  timezone: string; // IANA zone the session time is expressed in
  durationMinutes: number;
  location: string;
  amount: number; // in dollars
  currency: string; // e.g. 'USD'
}

function formatWhen(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
      timeZoneName: 'short',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hrs = mins / 60;
  return Number.isInteger(hrs) ? `${hrs} hr` : `${hrs.toFixed(1)} hr`;
}

// Escape values before interpolating them into the email HTML. Several fields
// (student/coach names, session title, gym/city) are user-controlled and reach
// this template via the webhook, so they must never be treated as raw markup.
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bookingHtml(d: BookingEmailData): string {
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
  const when = formatWhen(d.startsAt, d.timezone || 'UTC');
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: d.currency || 'USD',
  }).format(d.amount);
  const duration = formatDuration(d.durationMinutes);

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;color:#8a8a93;font-size:13px;">${label}</td>
      <td style="padding:10px 0;color:#16161a;font-size:14px;font-weight:600;text-align:right;">${esc(value)}</td>
    </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#0e0e10;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e10;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0e0e10;padding:24px 28px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Roll<span style="color:#E02D3C;">Wise</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;">
              <h1 style="margin:0 0 6px;color:#16161a;font-size:22px;">You're booked</h1>
              <p style="margin:0;color:#5b5b63;font-size:15px;line-height:1.5;">
                Hi ${esc(d.studentName)}, your payment of <strong>${amount}</strong> went through and your session is confirmed. Here are the details:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;border-radius:12px;padding:8px 18px;">
                <tr><td colspan="2" style="padding:12px 0 4px;color:#16161a;font-size:16px;font-weight:700;">${esc(d.sessionTitle)}</td></tr>
                ${row('When', when)}
                ${row('Duration', duration)}
                ${row('Location', d.location)}
                ${row('Coach', d.coachName)}
                ${row('Paid', amount)}
                ${row('Status', 'Confirmed')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 32px;" align="center">
              <a href="${appUrl}/app/student/my-bookings"
                 style="display:inline-block;background:#E02D3C;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:10px;">
                View my bookings
              </a>
              <p style="margin:20px 0 0;color:#9a9aa2;font-size:12px;line-height:1.5;">
                See you on the mats. If you didn't make this booking, reply to this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;color:#5b5b63;font-size:11px;">RollWise — private Jiu-Jitsu coaching</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Send a student their booking confirmation. No-ops if RESEND_API_KEY is unset. */
export async function sendBookingConfirmation(d: BookingEmailData): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return; // not configured yet — skip silently
  const from = Deno.env.get('EMAIL_FROM') || 'RollWise <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [d.to],
      subject: `You're booked: ${d.sessionTitle}`,
      html: bookingHtml(d),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}
