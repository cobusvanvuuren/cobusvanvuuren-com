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

const QUESTIONS = [
  { key: 'q0',  sys: 1, text: 'Captures every enquiry in one place without manual logging',          type: 'freq'  },
  { key: 'q1',  sys: 1, text: 'Can pull full client history in under 60 seconds',                    type: 'yesno' },
  { key: 'q2',  sys: 1, text: 'Every active client has a documented profile',                        type: 'yesno' },
  { key: 'q3',  sys: 1, text: 'Same information captured regardless of who answers',                 type: 'freq'  },
  { key: 'q4',  sys: 1, text: 'Mental bandwidth not consumed by remembering client context',         type: 'scale' },
  { key: 'q5',  sys: 2, text: 'New enquiries get substantive response within 2 hours without me',   type: 'yesno' },
  { key: 'q6',  sys: 2, text: 'Team handles common questions without escalating to me',              type: 'freq'  },
  { key: 'q7',  sys: 2, text: 'Documented criteria for common decisions — team rarely asks me',     type: 'scale' },
  { key: 'q8',  sys: 2, text: 'Fewer operational decisions than a year ago',                         type: 'yesno' },
  { key: 'q9',  sys: 2, text: 'Fewer than 3 situations per week require my personal decision',      type: 'yesno' },
  { key: 'q10', sys: 3, text: 'Repeated processes get documented so anyone can follow',              type: 'freq'  },
  { key: 'q11', sys: 3, text: 'Core recurring tasks have documented processes',                      type: 'yesno' },
  { key: 'q12', sys: 3, text: 'Can onboard a new client without managing every step personally',    type: 'yesno' },
  { key: 'q13', sys: 3, text: "Team knows what to do if I'm unavailable for a week",                type: 'yesno' },
  { key: 'q14', sys: 3, text: 'Building documented processes feels normal, not extra work',          type: 'scale' },
  { key: 'q15', sys: 4, text: 'Identified and quantified hours/week on non-expertise tasks',         type: 'scale' },
  { key: 'q16', sys: 4, text: 'Regularly review whether tasks could be delegated or automated',     type: 'freq'  },
  { key: 'q17', sys: 4, text: 'Moved at least one major recurring task off plate in past 3 months', type: 'yesno' },
  { key: 'q18', sys: 4, text: 'Business can function 3 days without my direct input',               type: 'yesno' },
  { key: 'q19', sys: 4, text: 'Clear picture of business running without me — actively building',   type: 'yesno' },
];

const ANSWER_LABELS = {
  yesno: { 0: 'Not yet', 5: 'Getting there', 10: 'Yes — nailed it' },
  freq:  { 0: 'Never', 2: 'Rarely', 5: 'Sometimes', 8: 'Often', 10: 'Always' },
  scale: { 0: '1 — Not at all', 2: '2', 5: '3 — Partially', 8: '4', 10: '5 — Completely' },
};

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const { name, email, phone, website, score, tier, type, s1, s2, s3, s4, bn, answers } = body;

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
          (name, email, phone, website, score, tier, s1, s2, s3, s4, bottleneck, business_type, answers, captured_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          score = excluded.score, tier = excluded.tier,
          s1 = excluded.s1, s2 = excluded.s2,
          s3 = excluded.s3, s4 = excluded.s4,
          bottleneck = excluded.bottleneck,
          business_type = excluded.business_type,
          answers = excluded.answers,
          completed_at = excluded.completed_at
      `).bind(
        name, email, phone || null, website || null,
        score, tier,
        s1 ?? null, s2 ?? null, s3 ?? null, s4 ?? null,
        bn ?? null, type || null,
        answers ? JSON.stringify(answers) : null,
        now, now
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
    const bodyText = tier === 'leverage'
      ? `Your ${bottleneckName} system is the constraint. Fix that and the rest of your operating leverage compounds significantly.`
      : msg.body;

    // Time-of-day greeting (SAST = UTC+2)
    const firstName = name.split(' ')[0];
    const saHour = (new Date().getUTCHours() + 2) % 24;
    const greeting = saHour >= 5 && saHour < 12 ? `Good morning, ${firstName},`
                   : saHour >= 12 && saHour < 17 ? `Good afternoon, ${firstName},`
                   : saHour >= 17 && saHour < 22 ? `Good evening, ${firstName},`
                   : `Hi ${firstName},`;

    await Promise.allSettled([
      sendEmail(env.RESEND_API_KEY, {
        from: 'Cobus van Vuuren <cobus@cobusvanvuuren.com>',
        to: email,
        subject: `Your AI Readiness Score: ${score}/200`,
        html: buildLeadEmail({ name, email, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, msg: { ...msg, body: bodyText }, greeting }),
      }),
      sendEmail(env.RESEND_API_KEY, {
        from: 'CVV Diagnostic <cobus@cobusvanvuuren.com>',
        to: 'hi@rhinoberry.com',
        subject: `New CVV Lead — ${name} scored ${score}/200 (${tierLabel})`,
        html: buildCobusEmail({ name, email, phone, website, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, type, answers }),
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

function buildLeadEmail({ name, email, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, msg, greeting }) {
  const hoursPerWeek = Math.round((200 - score) / 10);
  const daysPerYear  = Math.round(hoursPerWeek * 52 / 8);
  const monthlyCost  = Math.round(hoursPerWeek * 1500 * 4.33);
  const annualCost   = monthlyCost * 12;
  const paybackDays  = hoursPerWeek > 0 ? Math.ceil(9500 / (hoursPerWeek * 1500 / 5)) : null;
  const fmt = n => n.toLocaleString('en-ZA');

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
      <td style="padding:8px 0;border-bottom:1px solid #1e1c1a;font-family:Arial,sans-serif;font-size:14px;color:${isBn ? '#F7F4EF' : '#7A766E'};font-weight:${isBn ? '700' : '400'};">${isBn ? '&#9655; ' : ''}${sys.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #1e1c1a;text-align:right;font-family:Arial,sans-serif;font-size:14px;color:${color};">${sys.score}/50 &middot; ${label}</td>
    </tr>`;
  }).join('');

  const costBox = hoursPerWeek > 0 ? `
<tr><td style="height:28px;"></td></tr>

<tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:22px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A67C52;margin:0 0 18px;">What this gap is costing you</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#7A766E;padding:7px 0;">Recoverable hours per week</td>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;font-weight:700;text-align:right;padding:7px 0;">${hoursPerWeek} hrs</td>
    </tr>
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#7A766E;padding:7px 0;">Lost working days per year</td>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;font-weight:700;text-align:right;padding:7px 0;">${daysPerYear} days</td>
    </tr>
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#7A766E;padding:7px 0;">Monthly billing left on the table</td>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;font-weight:700;text-align:right;padding:7px 0;">R${fmt(monthlyCost)}</td>
    </tr>
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#7A766E;padding:7px 0;">Annual cost of doing nothing</td>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;font-weight:700;text-align:right;padding:7px 0;">R${fmt(annualCost)}</td>
    </tr>
  </table>
  ${paybackDays !== null ? `<p style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#C8282C;margin:0 0 8px;">At R1,500/hour, the audit pays for itself in under ${paybackDays} billing day${paybackDays === 1 ? '' : 's'}.</p>` : ''}
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0;">Based on a conservative R1,500/hr SA professional services rate.</p>
</td></tr>` : '';

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

<tr><td style="height:28px;"></td></tr>

<tr><td>
  <p style="font-family:Arial,sans-serif;font-size:18px;color:#F7F4EF;margin:0 0 12px;">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#F7F4EF;margin:0 0 16px;">${msg.headline}</p>
  <p style="font-family:Arial,sans-serif;font-size:18px;color:#7A766E;line-height:1.9;margin:0 0 8px;">${msg.body}</p>
</td></tr>

${costBox}

<tr><td style="height:28px;"></td></tr>

<tr><td>
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A67C52;margin:0 0 8px;">Your four systems</p>
  <table width="100%" cellpadding="0" cellspacing="0">${systemRows}</table>
</td></tr>

<tr><td style="height:32px;"></td></tr>

<tr><td style="text-align:center;">
  <a href="${msg.ctaUrl}" style="display:inline-block;background:#C8282C;color:#F7F4EF;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:16px 32px;border-radius:6px;">${msg.cta} &rarr;</a>
</td></tr>

<tr><td style="height:40px;"></td></tr>

<tr><td style="border-top:1px solid #1e1c1a;padding-top:20px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0 0 4px;">Cobus van Vuuren &middot; cobusvanvuuren.com</p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0 0 4px;">You received this because you completed the AI Readiness Diagnostic.</p>
  <p style="font-family:Arial,sans-serif;font-size:10px;color:#2A2520;margin:0;">Powered by <a href="https://rhinoberry.co.za" style="color:#2A2520;text-decoration:none;">RhinoBerry</a> &middot; <a href="mailto:cobus@cobusvanvuuren.com?subject=Unsubscribe&body=Please remove ${email} from your list." style="color:#2A2520;text-decoration:none;">Unsubscribe</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

function buildCobusEmail({ name, email, phone, website, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, type, answers }) {
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

  // Q&A grouped by system
  const SYS_NAMES = ['Intelligence Capture', 'Decision Speed', 'Process Independence', 'Time Reclamation'];
  let qaHtml = '';
  if (answers) {
    for (let sysNum = 1; sysNum <= 4; sysNum++) {
      const sysQs = QUESTIONS.filter(q => q.sys === sysNum);
      qaHtml += `<tr><td colspan="3" style="padding:14px 0 4px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A67C52;border-top:1px solid #1e1c1a;">${SYS_NAMES[sysNum - 1]}</td></tr>`;
      for (const q of sysQs) {
        const raw = answers[q.key];
        const label = raw !== undefined ? (ANSWER_LABELS[q.type][raw] ?? String(raw)) : '—';
        const pts = raw ?? 0;
        const isLow = pts <= 2;
        qaHtml += `<tr>
          <td style="padding:5px 8px 5px 0;font-family:Arial,sans-serif;font-size:12px;color:#7A766E;vertical-align:top;width:68%;">${q.text}</td>
          <td style="padding:5px 4px;font-family:Arial,sans-serif;font-size:12px;color:${isLow ? '#C8282C' : '#F7F4EF'};white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="padding:5px 0 5px 8px;font-family:monospace;font-size:12px;color:${isLow ? '#C8282C' : '#4A4540'};text-align:right;vertical-align:top;white-space:nowrap;">${pts}/10</td>
        </tr>`;
      }
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:32px;background:#0B0A09;font-family:Arial,sans-serif;">
<table style="max-width:560px;width:100%;">
<tr><td>
  <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#A67C52;margin:0 0 20px;">New CVV Lead</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;width:80px;">Name</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;font-weight:700;">${name}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Email</td><td style="padding:6px 0;font-size:13px;"><a href="mailto:${email}" style="color:#C8282C;">${email}</a></td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Phone</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${phone || '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Website</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${website || '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Type</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${type || '&mdash;'}</td></tr>
  </table>

  <p style="font-size:48px;font-weight:700;color:#F7F4EF;margin:0 0 4px;line-height:1;">${score}<span style="font-size:22px;color:#7A766E;">/200</span></p>
  <p style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C8282C;margin:0 0 20px;">${tierLabel} &middot; Bottleneck: ${bottleneckName}</p>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">${systemRows}</table>

  <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A67C52;margin:0 0 4px;">Full Q&amp;A</p>
  <table width="100%" cellpadding="0" cellspacing="0">${qaHtml}</table>
</td></tr>
</table>
</body></html>`;
}
