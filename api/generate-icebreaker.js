// api/generate-icebreaker.js
// Serverless function to generate personalized icebreaker lines

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from environment variables
  const API_KEY = process.env.CLAUDE_API_KEY;
  
  if (!API_KEY) {
    console.error('Missing CLAUDE_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    const { contact, channel = 'linkedin' } = req.body;

    if (!contact || !contact.name) {
      return res.status(400).json({ error: 'Missing required field: contact.name' });
    }

    const channelLabel = channel === 'linkedin' ? 'LinkedIn DM' : 'email opener';

    const prompt = `You are a warm, natural-sounding sales coach helping a solopreneur reconnect with a contact.

Contact details:
- Name: ${contact.name}
- Company: ${contact.company || 'not specified'}
- Job Title: ${contact.jobTitle || 'not specified'}
- Tags: ${(contact.tags || []).join(', ') || 'none'}
- Notes: ${contact.notes || 'none'}
- Last contacted: ${contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'never'}

Write exactly 3 distinct personalized opening lines for a ${channelLabel}. Rules:
- Each line must feel human, warm, and specific — not generic or salesy
- Each must reference something concrete from their details above
- Each must be 1–2 sentences, ready to send as-is
- Vary the tone: one casual, one professional, one curious/question-based
- ${channel === 'email' ? 'Include a natural subject line before each message, separated by " | "' : 'No subject line needed — just the opening message'}

Respond ONLY with a valid JSON array of exactly 3 strings. No preamble, no markdown, no explanation.
Example format: ["Opening line 1.", "Opening line 2.", "Opening line 3."]`;

    console.log('Calling Claude API for icebreaker generation...');

    // Call Claude API server-side
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'Claude API error', 
        details: errorData 
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '[]';
    const clean = raw.replace(/```json|```/g, '').trim();
    const lines = JSON.parse(clean);

    console.log('Generated icebreaker lines:', lines.length);

    // Return the icebreaker lines
    return res.status(200).json({ 
      lines: Array.isArray(lines) ? lines.slice(0, 3) : [] 
    });

  } catch (error) {
    console.error('Error in generate-icebreaker:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
