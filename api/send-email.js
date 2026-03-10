// api/send-email.js
// Sends individual personalized emails via Resend

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Resend API key from environment
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ 
      error: 'Email service not configured',
      message: 'Please add RESEND_API_KEY to Vercel environment variables'
    });
  }

  try {
    const { to, subject, body, fromName, fromEmail, scheduleDate, scheduleTime } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['to', 'subject', 'body']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ 
        error: 'Invalid email address',
        email: to
      });
    }

    // Determine sender email and name
    // Priority: fromEmail (custom domain) > default mikrocrm.app email
    const senderEmail = fromEmail || 'noreply@mikrocrm.app';
    const senderName = fromName || 'Micro CRM';

    // Convert plain text body to HTML (preserve line breaks)
    const htmlBody = body
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
      .join('');

    // Prepare email payload for Resend
    const emailPayload = {
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              p {
                margin: 0 0 10px 0;
              }
              a {
                color: #4F46E5;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            ${htmlBody}
          </body>
        </html>
      `,
      text: body, // Plain text fallback
      reply_to: senderEmail // Reply goes back to sender
    };

    console.log('Sending email to:', to);

    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to send email',
        details: data
      });
    }

    console.log('Email sent successfully:', data.id);

    // Return success
    return res.status(200).json({ 
      success: true,
      emailId: data.id,
      to: to,
      subject: subject
    });

  } catch (error) {
    console.error('Error in send-email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}