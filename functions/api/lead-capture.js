const SYSTEM_NAMES = [
  'Intelligence Capture',
  'Decision Speed',
  'Process Independence',
  'Time Reclamation',
];

const TIER_LABELS = {
  reactive: 'Reactive',
  emerging: 'Emerging',
  leverage: 'Leverage',
  mastery: 'Mastery',
};

const TIER_MESSAGES = {
  reactive: {
    headline: 'Your business is running on manual everything.',
    body: 'The good news: the leverage is huge once you start building. You have four clear systems to address, and the wins come fast in the first 90 days.',
    cta: 'Book a Free 15-Minute Call',
    ctaUrl: 'https://call.rhinoberry.com/meeting',
  },
  emerging: {
    headline: "You've started — but the systems aren't talking to each other yet.",
    body: "You have pieces in place but they're working in isolation. The next step is integration — getting your systems to work as one unit instead of four separate tools.",
    cta: 'Book a Free 15-Minute Call',
    ctaUrl: 'https://call.rhinoberry.com/meeting',
  },
  leverage: {
    headline: 'Real systems in 2–3 areas. One clear bottleneck holding the rest back.',
    body: null, // built dynamically using bottleneckName
    cta: 'Book a Business Automation Audit',
    ctaUrl: 'https://cobusvanvuuren.com/#audit',
  },
  mastery: {
    headline: 'AI is woven into your operating system.',
    body: "You're in the top tier. The next move is a partnership to push further — AI-native processes that most firms won't reach for another 3 years.",
    cta: 'Book a Partnership Call',
    ctaUrl: 'https://call.rhinoberry.com/meeting',
  },
};

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const { name, email, phone, website, score, tier, type, s1, s2, s3, s4, bn } = body;

  if (!name || !email) {
    return json({ ok: false, error: 'name and email required' }, 400);
  }

  const now = new Date().toISOString();
  const isCompletion = score !== null && score !== undefined;

  // ── D1 write ──────────────────────────────────────────────
  try {
    if (isCompletion) {
      await env.DB.prepare(`
        INSERT INTO cvv_leads
          (name, email, phone, website, score, tier, s1, s2, s3, s4, bottleneck, business_type, captured_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          score = excluded.score, tier = excluded.tier,
          s1 = excluded.s1, s2 = excluded.s2,
          s3 = excluded.s3, s4 = excluded.s4,
          bottleneck = excluded.bottleneck,
          business_type = excluded.business_type,
          completed_at = excluded.completed_at
      `).bind(
        name, email, phone || null, website || null,
        score, tier,
        s1 ?? null, s2 ?? null, s3 ?? null, s4 ?? null,
        bn ?? null, type || null, now, now
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO cvv_leads (name, email, phone, website, captured_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO NOTHING
      `).bind(name, email, phone || null, website || null, now).run();
    }
  } catch (err) {
    console.error('D1 error:', err);
  }

  // ── Emails on completion only ──────────────────────────────
  if (isCompletion) {
    const bottleneckName = SYSTEM_NAMES[(bn ?? 1) - 1];
    const tierLabel = TIER_LABELS[tier] || tier;
    const msg = TIER_MESSAGES[tier] || TIER_MESSAGES.reactive;
    const body = tier === 'leverage'
      ? `Your ${bottleneckName} system is the constraint. Fix that and the rest of your operating leverage compounds significantly.`
      : msg.body;

    await Promise.allSettled([
      sendEmail(env.RESEND_API_KEY, {
        from: 'Cobus van Vuuren <cobus@cobusvanvuuren.com>',
        to: email,
        subject: `Your AI Readiness Score: ${score}/200`,
        html: buildLeadEmail({ name, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, msg: { ...msg, body } }),
      }),
      sendEmail(env.RESEND_API_KEY, {
        from: 'CVV Diagnostic <cobus@cobusvanvuuren.com>',
        to: 'cobus@rhinoberry.co.za',
        subject: `New CVV Lead — ${name} scored ${score}/200 (${tierLabel})`,
        html: buildCobusEmail({ name, email, phone, website, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, type }),
      }),
    ]);
  }

  return json({ ok: true }, 200);
}

// ── helpers ───────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendEmail(apiKey, { from, to, subject, html }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', res.status, err);
    }
  } catch (err) {
    console.error('Resend fetch failed:', err);
  }
}

// ── email templates ───────────────────────────────────────────

function buildLeadEmail({ name, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, msg }) {
  const firstName = name.split(' ')[0];
  const hoursWasted = Math.round((200 - score) / 10);
  const monthlyLoss = ((200 - score) / 10 * 1500 * 4).toLocaleString('en-ZA');

  const systems = [
    { name: 'Intelligence Capture', score: s1 },
    { name: 'Decision Speed', score: s2 },
    { name: 'Process Independence', score: s3 },
    { name: 'Time Reclamation', score: s4 },
  ];

  const systemRows = systems.map((sys, i) => {
    const isBn = (i + 1) === bn;
    const label = sys.score >= 40 ? 'Strong' : sys.score >= 25 ? 'Developing' : 'Needs attention';
    const color = sys.score >= 40 ? '#2d7a4f' : sys.score >= 25 ? '#A67C52' : '#C8282C';
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #1e1c1a;font-family:Arial,sans-serif;font-size:13px;color:${isBn ? '#F7F4EF' : '#7A766E'};font-weight:${isBn ? '700' : '400'};">${isBn ? '&#9655; ' : ''}${sys.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1e1c1a;text-align:right;font-family:Arial,sans-serif;font-size:13px;color:${color};">${sys.score}/50 &middot; ${label}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0A09;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0A09;">
<tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

<tr><td style="padding-bottom:28px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#A67C52;margin:0 0 6px;">AI Readiness Diagnostic</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#4A4540;margin:0;">cobusvanvuuren.com</p>
</td></tr>

<tr><td style="background:rgba(200,40,44,0.08);border:1px solid rgba(200,40,44,0.25);border-radius:8px;padding:28px;text-align:center;">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#A67C52;margin:0 0 10px;">Your Score</p>
  <p style="font-family:Arial,sans-serif;font-size:60px;font-weight:700;color:#F7F4EF;margin:0;line-height:1;">${score}<span style="font-size:26px;color:#7A766E;">/200</span></p>
  <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C8282C;margin:10px 0 0;">${tierLabel}</p>
</td></tr>

<tr><td style="height:24px;"></td></tr>

<tr><td>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#F7F4EF;margin:0 0 4px;">${firstName},</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#F7F4EF;margin:0 0 12px;">${msg.headline}</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#7A766E;line-height:1.7;margin:0 0 24px;">${msg.body}</p>
</td></tr>

<tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:18px;margin-bottom:24px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A67C52;margin:0 0 10px;">The cost of the gap</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#7A766E;margin:0 0 5px;">Hours left on the table per week: <strong style="color:#F7F4EF;">${hoursWasted}</strong></p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#7A766E;margin:0;">Monthly unrealised billing: <strong style="color:#F7F4EF;">R${monthlyLoss}</strong></p>
</td></tr>

<tr><td style="height:24px;"></td></tr>

<tr><td>
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A67C52;margin:0 0 8px;">Your four systems</p>
  <table width="100%" cellpadding="0" cellspacing="0">${systemRows}</table>
</td></tr>

<tr><td style="height:32px;"></td></tr>

<tr><td style="text-align:center;">
  <a href="${msg.ctaUrl}" style="display:inline-block;background:#C8282C;color:#F7F4EF;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:6px;">${msg.cta} &rarr;</a>
</td></tr>

<tr><td style="height:40px;"></td></tr>

<tr><td style="border-top:1px solid #1e1c1a;padding-top:20px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0 0 3px;">Cobus van Vuuren &middot; cobusvanvuuren.com</p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0;">You received this because you completed the AI Readiness Diagnostic.</p>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

function buildCobusEmail({ name, email, phone, website, score, tierLabel, s1, s2, s3, s4, bn, bottleneckName, type }) {
  const systems = [
    { name: 'Intelligence Capture', score: s1 },
    { name: 'Decision Speed', score: s2 },
    { name: 'Process Independence', score: s3 },
    { name: 'Time Reclamation', score: s4 },
  ];

  const systemRows = systems.map((sys, i) => {
    const isBn = (i + 1) === bn;
    return `<tr>
      <td style="padding:6px 0;font-family:monospace;font-size:13px;color:${isBn ? '#C8282C' : '#7A766E'};">${isBn ? '&#9655; ' : '&nbsp;&nbsp;'}${sys.name}</td>
      <td style="padding:6px 0;font-family:monospace;font-size:13px;color:#F7F4EF;text-align:right;">${sys.score}/50</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px;background:#0B0A09;font-family:Arial,sans-serif;">
<table style="max-width:520px;">
<tr><td>
  <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#A67C52;margin:0 0 20px;">New CVV Lead</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;width:100px;">Name</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;font-weight:700;">${name}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Email</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;"><a href="mailto:${email}" style="color:#C8282C;">${email}</a></td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Phone</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${phone || '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Website</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${website || '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Type</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${type || '&mdash;'}</td></tr>
  </table>

  <p style="font-size:48px;font-weight:700;color:#F7F4EF;margin:0 0 4px;line-height:1;">${score}<span style="font-size:22px;color:#7A766E;">/200</span></p>
  <p style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C8282C;margin:0 0 20px;">${tierLabel} &middot; Bottleneck: ${bottleneckName}</p>

  <table width="100%" cellpadding="0" cellspacing="0">${systemRows}</table>
</td></tr>
</table>
</body></html>`;
}
