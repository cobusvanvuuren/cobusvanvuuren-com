import { BENCHMARKS } from './_benchmarks.js';

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

// secondaryCta/secondaryCtaUrl: the "not sure yet" call booking option,
// shown under the primary assessment CTA on every tier (added 2026-09-04 —
// these fields were already rendered by buildLeadEmail's template but
// never populated anywhere, so the button never appeared).
const CALL_BOOKING_URL = 'https://tidycal.com/cobus/meeting';

const TIER_MESSAGES = {
  reactive: {
    headline: 'Your business is running on manual everything.',
    body: 'The good news: the leverage is huge once you start building. You have four clear systems to address, and the wins come fast in the first 90 days.',
    cta: 'Claim Your Assessment',
    ctaUrl: 'https://cobusvanvuuren.com/audit',
    secondaryCta: 'Not 100% sure yet? Book a call first',
    secondaryCtaUrl: CALL_BOOKING_URL,
  },
  emerging: {
    headline: "You've started, but the systems aren't talking to each other yet.",
    body: "You have pieces in place but they're working in isolation. The next step is integration: getting your systems to work as one unit instead of four separate tools.",
    cta: 'Claim Your Assessment',
    ctaUrl: 'https://cobusvanvuuren.com/audit',
    secondaryCta: 'Not 100% sure yet? Book a call first',
    secondaryCtaUrl: CALL_BOOKING_URL,
  },
  leverage: {
    headline: 'Real systems in 2 to 3 areas. One clear bottleneck holding the rest back.',
    body: null, // built dynamically using bottleneckName
    cta: 'Claim Your Assessment',
    ctaUrl: 'https://cobusvanvuuren.com/audit',
    secondaryCta: 'Not 100% sure yet? Book a call first',
    secondaryCtaUrl: CALL_BOOKING_URL,
  },
  mastery: {
    headline: 'AI is woven into your operating system.',
    body: "You're in the top tier. The next move is a partnership to push further: AI-native processes that most firms won't reach for another 3 years.",
    cta: 'Claim Your Assessment',
    ctaUrl: 'https://cobusvanvuuren.com/audit',
    secondaryCta: 'Not 100% sure yet? Book a call first',
    secondaryCtaUrl: CALL_BOOKING_URL,
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
  { key: 'q7',  sys: 2, text: 'Documented criteria for common decisions, team rarely asks me',     type: 'scale' },
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
  { key: 'q19', sys: 4, text: 'Clear picture of business running without me, actively building',   type: 'yesno' },
];

const ANSWER_LABELS = {
  yesno: { 0: 'Not yet', 5: 'Getting there', 10: 'Yes, nailed it' },
  freq:  { 0: 'Never', 2: 'Rarely', 5: 'Sometimes', 8: 'Often', 10: 'Always' },
  scale: { 0: '1 (Not at all)', 2: '2', 5: '3 (Partially)', 8: '4', 10: '5 (Completely)' },
};

// Live price: keep in sync with the assessment price in audit.astro and terms.astro
const ASSESSMENT_PRICE_ZAR = 5497;

// Shared cost-of-gap formula — MUST stay identical to the copy in
// src/pages/score/results.astro (costRange), or the results page and this
// email quote different rand figures for the same lead. Shown as a range
// (4 to 4.33 weeks/month) rather than a single decimal-precision number: a
// 20-question self-assessment can't defensibly claim more precision than that.
const HOURLY_RATE_ZAR = 1500;
function costRange(hoursPerWeek) {
  const monthlyLow  = Math.round(hoursPerWeek * HOURLY_RATE_ZAR * 4);
  const monthlyHigh = Math.round(hoursPerWeek * HOURLY_RATE_ZAR * 4.33);
  return { monthlyLow, monthlyHigh, annualLow: monthlyLow * 12, annualHigh: monthlyHigh * 12 };
}

const VALID_TIERS = new Set(['reactive', 'emerging', 'leverage', 'mastery']);
const VALID_SIZES = new Set(['solo', 'micro', 'sweet-spot', 'mid', 'large']);
const VALID_PAINS = new Set(['owner-bottleneck', 'no-systems', 'lead-overflow', 'all-of-above']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Validates a request field is a string, trims it, caps its length, and (by
// default) strips control characters: defends the Resend subject/header
// fields and D1 columns against non-string payloads and header injection.
function cleanString(v, maxLen, { stripControl = true } = {}) {
  if (typeof v !== 'string') return null;
  let s = stripControl ? v.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ') : v;
  s = s.trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function clampInt(v, min, max) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < min || n > max) return null;
  return n;
}

// Only accepts one of the diagnostic's own fixed tag values (never an
// attacker-supplied string) for a column that's echoed back into internal
// emails and used for routing.
function validTag(v, allowedSet) {
  return typeof v === 'string' && allowedSet.has(v) ? v : null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (!isPlainObject(body)) {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const name  = cleanString(body.name, 150);
  const email = cleanString(body.email, 320);

  if (!name || !email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'name and a valid email are required' }, 400);
  }

  const phone   = cleanString(body.phone, 60);
  const website = cleanString(body.website, 300);
  const type    = cleanString(body.type, 60);
  const size    = validTag(body.size, VALID_SIZES);
  const pain    = validTag(body.pain, VALID_PAINS);
  const extra1  = cleanString(body.extra1, 2000, { stripControl: false }) || '';
  const extra2  = cleanString(body.extra2, 2000, { stripControl: false }) || '';

  const hasScore = body.score !== null && body.score !== undefined;
  let score = null, tier = null, s1 = null, s2 = null, s3 = null, s4 = null, bn = null, answers = null;

  if (hasScore) {
    score = clampInt(body.score, 0, 200);
    s1 = clampInt(body.s1, 0, 50);
    s2 = clampInt(body.s2, 0, 50);
    s3 = clampInt(body.s3, 0, 50);
    s4 = clampInt(body.s4, 0, 50);
    bn = clampInt(body.bn, 1, 4);
    tier = typeof body.tier === 'string' && VALID_TIERS.has(body.tier) ? body.tier : null;
    answers = isPlainObject(body.answers) ? body.answers : null;

    if (score === null || tier === null || s1 === null || s2 === null || s3 === null || s4 === null || bn === null) {
      return json({ ok: false, error: 'Invalid diagnostic result payload' }, 400);
    }
  }

  const now = new Date().toISOString();
  const isCompletion = hasScore;

  // ── D1 write ──────────────────────────────────────────────
  let dbWriteFailed = false;
  try {
    if (isCompletion) {
      await env.DB.prepare(`
        INSERT INTO cvv_leads
          (name, email, phone, website, score, tier, s1, s2, s3, s4, bottleneck, business_type, team_size, primary_pain, answers, captured_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          score = excluded.score, tier = excluded.tier,
          s1 = excluded.s1, s2 = excluded.s2,
          s3 = excluded.s3, s4 = excluded.s4,
          bottleneck = excluded.bottleneck,
          business_type = COALESCE(excluded.business_type, cvv_leads.business_type),
          team_size = COALESCE(excluded.team_size, cvv_leads.team_size),
          primary_pain = COALESCE(excluded.primary_pain, cvv_leads.primary_pain),
          answers = excluded.answers,
          completed_at = excluded.completed_at
      `).bind(
        name, email, phone || null, website || null,
        score, tier,
        s1 ?? null, s2 ?? null, s3 ?? null, s4 ?? null,
        bn ?? null, type || null, size, pain,
        answers ? JSON.stringify({ ...answers, extra1: extra1 || '', extra2: extra2 || '' }) : null,
        now, now
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO cvv_leads (name, email, phone, website, business_type, team_size, primary_pain, captured_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          business_type = COALESCE(excluded.business_type, cvv_leads.business_type),
          team_size = COALESCE(excluded.team_size, cvv_leads.team_size),
          primary_pain = COALESCE(excluded.primary_pain, cvv_leads.primary_pain)
      `).bind(name, email, phone || null, website || null, type || null, size, pain, now).run();
    }
  } catch (err) {
    console.error('D1 error:', err);
    dbWriteFailed = true;
  }

  // ── Emails on completion only ──────────────────────────────
  if (isCompletion) {
    const bottleneckName = SYSTEM_NAMES[bn - 1];
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
        from: 'Cobus van Vuuren <ask@cobusvanvuuren.com>',
        to: email,
        subject: `Your AI Readiness Score: ${score}/200`,
        html: buildLeadEmail({ name, email, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, msg: { ...msg, body: bodyText }, greeting, answers }),
      }),
      sendEmail(env.RESEND_API_KEY, {
        from: 'CVV Diagnostic <ask@cobusvanvuuren.com>',
        to: 'cobus@rhinoberry.co.za',
        subject: `New CVV Lead: ${name} scored ${score}/200 (${tierLabel})`,
        html: buildCobusEmail({ name, email, phone, website, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, type, size, pain, answers, extra1, extra2 }),
      }),
    ]);
  }

  // Surface storage failures instead of always reporting { ok: true }. The
  // client fire-and-forgets this response, so this only affects server-side
  // visibility (Cloudflare Functions logs), not the user's flow.
  return json({ ok: !dbWriteFailed }, dbWriteFailed ? 500 : 200);
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

// Strongest + weakest individual answer, named together — same "seesaw"
// logic as src/pages/score/results.astro's buildSeesaw(), kept in sync
// deliberately rather than sharing a module (browser page vs. Worker
// function are different runtimes here). Returns null rather than a
// partial result when there isn't enough data to compare.
function getSeesaw(answers) {
  if (!answers || typeof answers !== 'object') return null;
  const entries = QUESTIONS
    .map(q => ({ ...q, val: answers[q.key] }))
    .filter(q => typeof q.val === 'number');
  if (entries.length < 2) return null;

  const highest = entries.reduce((a, b) => (b.val > a.val ? b : a));
  const lowest  = entries.reduce((a, b) => (b.val < a.val ? b : a));
  if (highest.key === lowest.key) return null;

  const label = (q) => (ANSWER_LABELS[q.type] && ANSWER_LABELS[q.type][q.val]) || '';
  return { highestText: highest.text, highestLabel: label(highest), lowestText: lowest.text, lowestLabel: label(lowest) };
}

function buildLeadEmail({ name, email, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, msg, greeting, answers }) {
  const hoursPerWeek = Math.round((200 - score) / 10);
  const daysPerYear  = Math.round(hoursPerWeek * 52 / 8);
  const gapRange     = costRange(hoursPerWeek);
  const paybackDays  = hoursPerWeek > 0 ? Math.ceil(ASSESSMENT_PRICE_ZAR / (hoursPerWeek * HOURLY_RATE_ZAR / 5)) : null;
  const fmt = n => n.toLocaleString('en-ZA');
  const seesaw = getSeesaw(answers);

  const cohortLine = (BENCHMARKS && typeof BENCHMARKS.overall_median === 'number' && BENCHMARKS.n)
    ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#7A766E;margin:14px 0 0;padding-top:14px;border-top:1px solid #1e1c1a;">Your score is ${score > BENCHMARKS.overall_median ? 'above' : score < BENCHMARKS.overall_median ? 'below' : 'at'} the median of the ${BENCHMARKS.n} business owners who've completed this diagnostic so far.</p>`
    : '';

  const seesawBox = seesaw ? `
<tr><td style="height:28px;"></td></tr>
<tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:22px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A67C52;margin:0 0 14px;">In your own answers</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;line-height:1.7;margin:0 0 10px;"><span style="color:#2d7a4f;font-weight:700;">Strongest:</span> &ldquo;${escapeHtml(seesaw.highestText)}&rdquo; &mdash; ${escapeHtml(seesaw.highestLabel)}.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;line-height:1.7;margin:0;"><span style="color:#C8282C;font-weight:700;">Weakest:</span> &ldquo;${escapeHtml(seesaw.lowestText)}&rdquo; &mdash; ${escapeHtml(seesaw.lowestLabel)}.</p>
  ${cohortLine}
</td></tr>` : '';

  // Qualifying question, not a survey question ("reply with a number" gets
  // low-effort replies that don't tell Cobus whether to spend time on the
  // lead). Anchored to their actual weakest answer when we have one.
  const closingQuestion = seesaw
    ? `You flagged &ldquo;${escapeHtml(seesaw.lowestText)}&rdquo; as a weak spot. Roughly what's that costing you a week, in time or missed follow-up?`
    : `Is fixing this something you want done in the next 90 days, or is it more exploratory for now?`;

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
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;font-weight:700;text-align:right;padding:7px 0;">R${fmt(gapRange.monthlyLow)}&ndash;R${fmt(gapRange.monthlyHigh)}</td>
    </tr>
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#7A766E;padding:7px 0;">Annual cost of doing nothing</td>
      <td style="font-family:Arial,sans-serif;font-size:14px;color:#F7F4EF;font-weight:700;text-align:right;padding:7px 0;">R${fmt(gapRange.annualLow)}&ndash;R${fmt(gapRange.annualHigh)}</td>
    </tr>
  </table>
  ${paybackDays !== null ? `<p style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#C8282C;margin:0 0 8px;">At R${HOURLY_RATE_ZAR.toLocaleString()}/hour, the assessment pays for itself in under ${paybackDays} billing day${paybackDays === 1 ? '' : 's'}.</p>` : ''}
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0;">Based on a conservative R${HOURLY_RATE_ZAR.toLocaleString()}/hr rate, roughly what this ICP bills for their own time, your actual rate may be higher or lower.</p>
</td></tr>` : '';

  // encodeURIComponent, not escapeHtml, because these values populate a
  // mailto: query string, not HTML body text; it also neutralises any
  // header-injection-style characters (&, ?, %0A) in the email address.
  const unsubscribeHref = `mailto:ask@cobusvanvuuren.com?subject=${encodeURIComponent('Unsubscribe')}&body=${encodeURIComponent(`Please remove ${email} from your list.`)}`;

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
  <p style="font-family:Arial,sans-serif;font-size:18px;color:#F7F4EF;margin:0 0 12px;">${escapeHtml(greeting)}</p>
  <p style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#F7F4EF;margin:0 0 16px;">${msg.headline}</p>
  <p style="font-family:Arial,sans-serif;font-size:18px;color:#7A766E;line-height:1.9;margin:0 0 8px;">${msg.body}</p>
</td></tr>

${costBox}

<tr><td style="height:28px;"></td></tr>

<tr><td>
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A67C52;margin:0 0 8px;">Your four systems</p>
  <table width="100%" cellpadding="0" cellspacing="0">${systemRows}</table>
</td></tr>
${seesawBox}
<tr><td style="height:32px;"></td></tr>

<tr><td style="text-align:center;">
  <a href="${msg.ctaUrl}" style="display:inline-block;background:#C8282C;color:#F7F4EF;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:16px 32px;border-radius:6px;">${msg.cta} &rarr;</a>
</td></tr>
${msg.secondaryCta ? `
<tr><td style="height:16px;"></td></tr>
<tr><td style="text-align:center;">
  <a href="${msg.secondaryCtaUrl}" style="font-family:Arial,sans-serif;font-size:13px;color:#7A766E;text-decoration:underline;">${msg.secondaryCta} &rarr;</a>
</td></tr>` : ''}

<tr><td style="height:36px;"></td></tr>

<tr><td style="background:rgba(255,255,255,0.02);border-radius:6px;padding:18px 20px;">
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#7A766E;line-height:1.7;margin:0 0 6px;">I read every one of these myself.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#F7F4EF;line-height:1.7;margin:0;">${closingQuestion} Just reply, I'll see it.</p>
</td></tr>

<tr><td style="height:40px;"></td></tr>

<tr><td style="border-top:1px solid #1e1c1a;padding-top:20px;">
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0 0 4px;">Cobus van Vuuren &middot; cobusvanvuuren.com</p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#3A3530;margin:0 0 4px;">You received this because you completed the AI Readiness Diagnostic.</p>
  <p style="font-family:Arial,sans-serif;font-size:10px;color:#2A2520;margin:0;">Powered by <a href="https://rhinoberry.co.za" style="color:#2A2520;text-decoration:none;">RhinoBerry</a> &middot; <a href="${unsubscribeHref}" style="color:#2A2520;text-decoration:none;">Unsubscribe</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`;
}

const SIZE_LABELS = { solo: 'Just me', micro: '2 to 4', 'sweet-spot': '5 to 15', mid: '16 to 50', large: '51+' };
const PAIN_LABELS = {
  'owner-bottleneck': 'Too much runs through me personally',
  'no-systems': "Systems aren't in place, things fall through the cracks",
  'lead-overflow': 'Too busy to handle the leads I already have',
  'all-of-above': 'All of the above',
};

function buildCobusEmail({ name, email, phone, website, score, tier, tierLabel, s1, s2, s3, s4, bn, bottleneckName, type, size, pain, answers, extra1, extra2 }) {
  const isCinderella = type === 'prof-services' && size === 'sweet-spot' && pain === 'owner-bottleneck';
  const seesaw = getSeesaw(answers);
  const cohortLine = (BENCHMARKS && typeof BENCHMARKS.overall_median === 'number' && BENCHMARKS.n)
    ? `${score > BENCHMARKS.overall_median ? 'Above' : score < BENCHMARKS.overall_median ? 'Below' : 'At'} the median of ${BENCHMARKS.n} completions`
    : null;

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
        const validLabels = ANSWER_LABELS[q.type];
        // Only render values that are one of the fixed labels this question
        // type actually offers. Anything else (wrong type, out-of-range,
        // attacker-supplied) is dropped rather than echoed into the email.
        const hasValidAnswer = typeof raw === 'number' && Object.prototype.hasOwnProperty.call(validLabels, raw);
        const label = hasValidAnswer ? validLabels[raw] : '-';
        const pts = hasValidAnswer ? raw : 0;
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
  ${isCinderella ? `<p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0B0A09;background:#e8a838;display:inline-block;padding:4px 10px;border-radius:4px;margin:0 0 16px;">Cinderella &mdash; prof-services, 5-15 staff, owner-bottleneck</p>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;width:80px;">Name</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;font-weight:700;">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Email</td><td style="padding:6px 0;font-size:13px;"><a href="mailto:${escapeHtml(email)}" style="color:#C8282C;">${escapeHtml(email)}</a></td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Phone</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${phone ? escapeHtml(phone) : '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Website</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${website ? escapeHtml(website) : '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Type</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${type ? escapeHtml(type) : '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Team size</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${size && SIZE_LABELS[size] ? escapeHtml(SIZE_LABELS[size]) : '&mdash;'}</td></tr>
    <tr><td style="padding:6px 0;font-size:13px;color:#7A766E;">Biggest blocker</td><td style="padding:6px 0;font-size:13px;color:#F7F4EF;">${pain && PAIN_LABELS[pain] ? escapeHtml(PAIN_LABELS[pain]) : '&mdash;'}</td></tr>
  </table>

  <p style="font-size:48px;font-weight:700;color:#F7F4EF;margin:0 0 4px;line-height:1;">${score}<span style="font-size:22px;color:#7A766E;">/200</span></p>
  <p style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C8282C;margin:0 0 4px;">${tierLabel} &middot; Bottleneck: ${bottleneckName}</p>
  ${cohortLine ? `<p style="font-size:12px;color:#7A766E;margin:0 0 20px;">${cohortLine}</p>` : '<div style="height:20px;"></div>'}

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">${systemRows}</table>

  ${seesaw ? `
  <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A67C52;margin:0 0 8px;">Seesaw</p>
  <p style="font-size:13px;color:#F7F4EF;line-height:1.6;margin:0 0 6px;"><span style="color:#2d7a4f;font-weight:700;">Strongest:</span> ${escapeHtml(seesaw.highestText)} &mdash; ${escapeHtml(seesaw.highestLabel)}</p>
  <p style="font-size:13px;color:#F7F4EF;line-height:1.6;margin:0 0 24px;"><span style="color:#C8282C;font-weight:700;">Weakest:</span> ${escapeHtml(seesaw.lowestText)} &mdash; ${escapeHtml(seesaw.lowestLabel)}</p>` : ''}

  <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A67C52;margin:0 0 4px;">Full Q&amp;A</p>
  <table width="100%" cellpadding="0" cellspacing="0">${qaHtml}</table>
  ${extraContextHtml({ extra1, extra2 })}
</td></tr>
</table>
</body></html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\n/g, '<br/>');
}

function extraContextHtml({ extra1, extra2 }) {
  const rows = [
    { label: "What's the one thing about your business that, if it changed, would make the biggest difference to you?", value: extra1 },
    { label: 'What else do we need to know about your business or situation?', value: extra2 },
  ].filter(r => r.value && r.value.trim());

  if (!rows.length) return '';

  const items = rows.map(r => `
    <p style="font-size:12px;color:#7A766E;margin:12px 0 4px;">${escapeHtml(r.label)}</p>
    <p style="font-size:13px;color:#F7F4EF;margin:0 0 4px;">${escapeHtml(r.value.trim())}</p>
  `).join('');

  return `
  <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#A67C52;margin:24px 0 4px;border-top:1px solid #1e1c1a;padding-top:16px;">Additional context</p>
  ${items}`;
}
