// api/analyze-image.js
// Serverless function to analyze images and extract contact info

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

  // Get the API key from environment variables (hidden from users)
  const API_KEY = process.env.CLAUDE_API_KEY;
  
  if (!API_KEY) {
    console.error('Missing CLAUDE_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields: base64Data and mimeType' });
    }

    console.log('Calling Claude API for image analysis...');

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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64Data }
            },
            {
              type: 'text',
              text: `Extract contact information from this image (business card, screenshot, etc.).

Return ONLY a JSON object with these fields (use empty strings if not found):
{
  "name": "",
  "email": "",
  "phone": "",
  "company": "",
  "jobTitle": "",
  "website": "",
  "address": ""
}

Be precise. Extract only what you clearly see. Do not add markdown, preamble, or extra text.`
            }
          ]
        }]
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
    const text = data.content?.[0]?.text || '{}';
    
    console.log('Claude response:', text);

    // Clean and parse the response
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Return the extracted contact info
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Error in analyze-image:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
