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
    const { contact, businessProfile, recipientCount, purpose, customPrompt } = req.body;

    if (!contact || !contact.name) {
      return res.status(400).json({ error: 'Missing required field: contact (sample contact for template)' });
    }

    // Build business context
    const businessName = businessProfile?.businessName || 'our company';
    const industry = businessProfile?.industry || 'our industry';
    const description = businessProfile?.description || 'provide quality service';
    const targetAudience = businessProfile?.targetAudience || 'business professionals';
    const valueProposition = businessProfile?.valueProposition || 'deliver value';

    let prompt = '';

    // PRIORITY 1: Use custom prompt if provided
    if (customPrompt && customPrompt.trim()) {
      prompt = `You are an expert email copywriter. Write an email based on these EXACT CUSTOM INSTRUCTIONS from the user:

"${customPrompt.trim()}"

BUSINESS CONTEXT (use if relevant):
- Business Name: ${businessName}
- Industry: ${industry}
- What They Do: ${description}
- Value Proposition: ${valueProposition}

SAMPLE RECIPIENT (use for personalization):
- Name: ${contact.name}
- First Name: ${contact.name.split(' ')[0]}
- Company: ${contact.company || 'their company'}

NUMBER OF RECIPIENTS: ${recipientCount || 1}

CRITICAL REQUIREMENTS:
1. Follow the custom instructions EXACTLY as written above
2. Use {firstName} as a placeholder for personalization
3. Use {companyName} if company names should be personalized
4. Match the tone, style, and length specified in the custom instructions
5. If no specific length given, keep it concise (3-4 sentences)

Respond ONLY with a valid JSON object in this exact format:
{
  "subject": "Your subject line here (use {firstName} or {companyName} if appropriate)",
  "body": "Hi {firstName},\\n\\nYour email body here following the custom instructions.\\n\\nBest regards,\\n${businessName}"
}

No preamble, no markdown, no explanation. ONLY the JSON.`;

    } 
    // PRIORITY 2: Use preset purpose templates
    else if (purpose) {
      const purposeInstructions = {
        'follow-up': 'Write a friendly follow-up email to check in after a previous conversation. Ask how things are going and if they need any help.',
        'introduction': `Write a professional introduction email for ${businessName}. Introduce the business and its value proposition. Request a brief call or meeting.`,
        'sales': `Write a compelling sales email for ${businessName}. Highlight the value proposition and include a clear call-to-action.`,
        'thank-you': 'Write a warm thank you email expressing genuine appreciation for their time, partnership, or support.',
        'update': `Write a professional update email sharing recent news or developments about ${businessName}.`,
        'feedback': 'Write a polite email requesting their feedback or input on a recent interaction or service.',
        'networking': 'Write a networking email to explore potential collaboration opportunities. Be professional but approachable.',
        'reminder': 'Write a gentle reminder email about an upcoming deadline, meeting, or action item.',
        'proposal': `Write a professional proposal email outlining how ${businessName} can help solve their challenges.`,
        'event-invite': 'Write an engaging event invitation email with clear details and a compelling reason to attend.'
      };

      const purposeInstruction = purposeInstructions[purpose] || purposeInstructions['follow-up'];

      prompt = `You are an expert email copywriter. ${purposeInstruction}

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

REQUIREMENTS:
1. Subject line: Compelling, max 60 characters, use {firstName} or {companyName} if appropriate
2. Email body:
   - Start with "Hi {firstName}," (use this exact placeholder)
   - 3-4 sentences maximum
   - Mention the business name and value proposition naturally
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

    }
    // FALLBACK: Generic template
    else {
      prompt = `You are an expert email copywriter helping a business owner write a bulk outreach email.

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
    }

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