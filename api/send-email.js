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
    const { to, subject, body, fromName, fromEmail, replyToEmail, images, scheduleDate, scheduleTime } = req.body;

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
    // IMPORTANT: Always use Resend's verified default domain
    // Custom domains require verification in Resend dashboard first
    
    let senderEmail = 'onboarding@resend.dev'; // Resend's verified sending domain
    
    // Check if user has a verified custom domain (not mikrocrm.app)
    if (fromEmail && fromEmail.includes('@') && !fromEmail.includes('@mikrocrm.app')) {
      // Only use custom email if it's NOT mikrocrm.app (which is unverified)
      // User must verify their own domain in Resend first
      senderEmail = fromEmail;
    }
    
    const senderName = fromName || 'Micro CRM';
    
    // Determine reply-to email
    // This is where replies will actually go (user's personal email)
    const replyTo = replyToEmail || senderEmail;
    
    // Log what we're using (helps debug)
    console.log('Email sending config:', {
      from: `${senderName} <${senderEmail}>`,
      replyTo: replyTo,
      to: to,
      originalFromEmail: fromEmail // What was requested
    });

    // Convert email body with images and links to HTML
    let htmlBody = body;
    
    // Create image lookup map
    const imageMap = {};
    if (images && Array.isArray(images)) {
      images.forEach(img => {
        imageMap[img.id] = img.data;
      });
    }
    
    // Process image tags: <img src="img_id" alt="name" />
    htmlBody = htmlBody.replace(/<img src="([^"]+)" alt="([^"]*)" \/>/g, (match, imgId, altText) => {
      const imageData = imageMap[imgId];
      if (imageData) {
        return `<img src="${imageData}" alt="${altText}" style="max-width: 100%; height: auto; margin: 15px 0; border-radius: 8px; display: block;" />`;
      }
      return ''; // Remove if image not found
    });
    
    // Process HTML links: <a href="url">text</a> - add styling
    htmlBody = htmlBody.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, (match, url, text) => {
      return `<a href="${url}" style="color: #4F46E5; text-decoration: none; font-weight: 500; border-bottom: 1px solid #4F46E5;">${text}</a>`;
    });
    
    // Convert line breaks to paragraphs (preserve existing HTML)
    const lines = htmlBody.split('\n');
    htmlBody = lines.map(line => {
      line = line.trim();
      if (!line) return '<br>';
      // Don't wrap if already HTML tag
      if (line.startsWith('<')) return line;
      return `<p style="margin: 0 0 10px 0;">${line}</p>`;
    }).join('');

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
      reply_to: replyTo // Reply goes to user's preferred email
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
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      
      // Return detailed error for debugging
      return res.status(response.status).json({ 
        error: 'Failed to send email',
        details: data,
        message: data.message || 'Email service error',
        fromEmail: senderEmail,
        toEmail: to
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