// api/generate-email.js
// NEW - Serverless function to generate bulk email content with AI

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
    const { contact, businessProfile, recipientCount } = req.body;

    if (!contact || !contact.name) {
      return res.status(400).json({ error: 'Missing required field: contact (sample contact for template)' });
    }

    // Build business context
    const businessName = businessProfile?.businessName || 'our company';
    const industry = businessProfile?.industry || 'our industry';
    const description = businessProfile?.description || 'provide quality service';
    const targetAudience = businessProfile?.targetAudience || 'business professionals';
    const valueProposition = businessProfile?.valueProposition || 'deliver value';

    const prompt = `You are an expert email copywriter helping a business owner write a bulk outreach email.

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Industry: ${industry}
- What They Do: ${description}
- Target Audience: ${targetAudience}
- Value Proposition: ${valueProposition}

SAMPLE RECIPIENT:
- Name: ${contact.name}
- Company: ${contact.company || 'their company'}
- Job Title: ${contact.jobTitle || 'their role'}

NUMBER OF RECIPIENTS: ${recipientCount || 1}

Write a professional bulk email that will be personalized for ${recipientCount} recipients.

REQUIREMENTS:
1. Subject line: Compelling, max 60 characters, no clickbait
2. Email body:
   - Start with "Hi {firstName}," (use this exact placeholder)
   - 3-4 sentences maximum
   - Mention the business name and value proposition naturally
   - Reference how you can help their type of business/role
   - Include a clear, simple call to action
   - Professional but friendly tone
3. No marketing jargon or buzzwords
4. No "I hope this email finds you well" clichés

Respond ONLY with a valid JSON object in this exact format:
{
  "subject": "Your subject line here",
  "body": "Hi {firstName},\\n\\nYour email body here with {firstName} placeholder.\\n\\nBest regards,\\n${businessName}"
}

No preamble, no markdown, no explanation.`;

    console.log('Calling Claude API for email generation...');

    // Call Claude API
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
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'Claude API error', 
        details: errorData 
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    console.log('Generated email:', result.subject);

    // Return the email content
    return res.status(200).json({ 
      subject: result.subject || 'Quick follow-up',
      body: result.body || `Hi {firstName},\n\nHope you're doing well!\n\nBest regards,\n${businessName}`
    });

  } catch (error) {
    console.error('Error in generate-email:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
