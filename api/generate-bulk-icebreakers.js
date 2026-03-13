// api/generate-bulk-icebreakers.js
// Generates ONE generic broadcast message for social channels.
// Called in social mode only — message must be name-free so it works as a BC.
// For email mode, the frontend calls generate-icebreaker.js per contact instead.

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
    const { channel, businessProfile, customPrompt, broadcastMode } = req.body;

    const channelLabel = {
      whatsapp: 'WhatsApp broadcast',
      instagram: 'Instagram DM broadcast',
      twitter: 'X/Twitter DM broadcast',
      facebook: 'Facebook message broadcast',
      linkedin: 'LinkedIn DM broadcast',
    }[channel] || 'social media broadcast';

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

    // ── Build prompt ──────────────────────────────────────────────────────────
    let prompt;

    if (customPrompt && customPrompt.trim()) {
      // Custom prompt takes full control
      prompt = `You are writing a ${channelLabel} message on behalf of a business owner.
${businessContext}

INSTRUCTION FROM THE SENDER:
"${customPrompt.trim()}"

CRITICAL RULES — broadcast message:
- Do NOT address anyone by name — this goes to many people at once
- Do NOT use "Hi [name]", "Dear [name]" or any placeholder
- Write as if speaking to a group: "Hi everyone", "Hey folks", or jump straight in
- Keep it concise and natural — suitable for ${channelLabel}
- Sound human, not like a marketing email

Respond ONLY with a valid JSON array containing exactly 1 string. No preamble, no markdown.
Example: ["Your broadcast message here."]`;
    } else {
      // Default: business context driven, no names
      prompt = `You are a warm, natural-sounding business owner writing a ${channelLabel} to a group of new potential clients.
${businessContext}

Write ONE short broadcast outreach message.

CRITICAL RULES:
- Do NOT use anyone's name — this is a broadcast to multiple people
- Do NOT use placeholders like "[Name]" or "{name}"
- Address the audience generally: "Hey everyone", "Hi there", or open without greeting
- Reference what your business does and why you're reaching out
- Keep it under 4 sentences — short and punchy works best for ${channelLabel}
- Sound genuine and human, not like a template

Respond ONLY with a valid JSON array containing exactly 1 string. No preamble, no markdown.
Example: ["Your broadcast message here."]`;
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
        max_tokens: 400,
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
    const message = Array.isArray(parsed) ? parsed[0] : parsed;

    return res.status(200).json({ message, results: { broadcast: message } });

  } catch (error) {
    console.error('Error in generate-bulk-icebreakers:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}