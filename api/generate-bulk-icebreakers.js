// api/generate-bulk-icebreakers.js
// Serverless function to generate icebreakers for multiple contacts

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from environment variables
  const API_KEY = process.env.CLAUDE_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    const { contacts, channel = 'linkedin' } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Missing required field: contacts (array)' });
    }

    // Limit to 20 contacts max to prevent abuse
    if (contacts.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 contacts allowed per request' });
    }

    const channelLabel = channel === 'linkedin' ? 'LinkedIn DM' : 'email opener';
    const results = {};

    // Process each contact sequentially
    for (const contact of contacts) {
      if (!contact.id || !contact.name) {
        results[contact.id || 'unknown'] = ['Error: Missing contact name'];
        continue;
      }

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

Respond ONLY with a valid JSON array of exactly 3 strings. No preamble, no markdown, no explanation.`;

      try {
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
          results[contact.id] = ['Error generating icebreaker - try again'];
          continue;
        }

        const data = await response.json();
        const raw = data.content?.[0]?.text || '[]';
        const clean = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        results[contact.id] = Array.isArray(parsed) ? parsed.slice(0, 3) : ['Error: Invalid response'];

      } catch (error) {
        console.error(`Error generating for contact ${contact.id}:`, error);
        results[contact.id] = ['Error generating icebreaker'];
      }
    }

    // Return all results
    return res.status(200).json({ results });

  } catch (error) {
    console.error('Error in generate-bulk-icebreakers:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
