// api/generate-icebreaker.js
// Generates ONE personalised icebreaker for a single contact.
// Used by: single contact modal + bulk email mode (called per contact).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.CLAUDE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Missing CLAUDE_API_KEY' });

  try {
    const { contact, channel, businessProfile, customPrompt } = req.body;

    if (!contact || !contact.name) {
      return res.status(400).json({ error: 'Missing required field: contact.name' });
    }

    const isEmail = channel === 'email';

    // ── Business context ──────────────────────────────────────────────────────
    let businessContext = '';
    if (businessProfile?.description) {
      businessContext = `
YOUR BUSINESS CONTEXT:
- Business Name: ${businessProfile.businessName || 'Not specified'}
- Industry: ${businessProfile.industry || 'Not specified'}
- What You Do: ${businessProfile.description}
- Target Audience: ${businessProfile.targetAudience || 'Not specified'}
- Value Proposition: ${businessProfile.valueProposition || 'Not specified'}`;
    }

    // ── Contact context ───────────────────────────────────────────────────────
    const contactContext = `
CONTACT DETAILS:
- Name: ${contact.name}
- Company: ${contact.company || 'not specified'}
- Job Title: ${contact.jobTitle || 'not specified'}
- Industry/Tags: ${(contact.tags || []).join(', ') || 'none'}
- Notes: ${contact.notes || 'none'}`;

    // ── Build prompt ──────────────────────────────────────────────────────────
    let prompt;

    if (customPrompt && customPrompt.trim()) {
      // Custom prompt always takes full control
      prompt = `You are writing a personalised ${isEmail ? 'email' : 'outreach message'} on behalf of a business owner.
${businessContext}
${contactContext}

INSTRUCTION FROM THE SENDER:
"${customPrompt.trim()}"

Follow the instruction above closely. Write exactly ONE message for ${contact.name}.
${isEmail
  ? 'Format: "Subject line | Email body". Keep the body natural and concise.'
  : 'Write just the message body — no subject line needed.'}

Respond ONLY with a valid JSON array containing exactly 1 string. No preamble, no markdown.
Example: ["Your message here."]`;
    } else {
      // Default: use business + contact context to craft personalised outreach
      prompt = `You are a warm, natural-sounding sales coach writing on behalf of a business owner reaching out to a new contact for the first time.
${businessContext}
${contactContext}

Write exactly ONE personalised opening message for a ${isEmail ? 'cold email' : `${channel} DM`} to ${contact.name}.

RULES:
- Sound human and warm — not generic or salesy
- Reference something specific about their company or role
${businessContext ? '- Connect how YOUR business can genuinely help THEIR business' : ''}
- Keep it concise: 2–4 sentences max
- Do NOT use the recipient's name more than once
${isEmail
  ? '- Format: "Subject line | Email body" (separated by " | ")'
  : '- No subject line — just the message body'}

Respond ONLY with a valid JSON array containing exactly 1 string. No preamble, no markdown.
Example: ${isEmail ? '["Great subject line | Hi, your message body here."]' : '["Your message here."]'}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: 'Claude API error', details: err });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '[]';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const lines = Array.isArray(parsed) ? parsed.slice(0, 3) : [parsed];

    return res.status(200).json({ lines });

  } catch (error) {
    console.error('Error in generate-icebreaker:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}