// api/send-email.js
// Sends individual personalized emails via Resend
// Images are uploaded to imgbb (free CDN) so email clients can display them

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

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY; // Add this to Vercel env vars

  if (!RESEND_API_KEY) {
    return res.status(500).json({
      error: 'Email service not configured',
      message: 'Please add RESEND_API_KEY to Vercel environment variables'
    });
  }

  try {
    const { to, subject, body, fromName, fromEmail, replyToEmail, images, links } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields', required: ['to', 'subject', 'body'] });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address', email: to });
    }

    // ─── STEP 1: Upload base64 images to imgbb and build a URL map ───────────
    const imageUrlMap = {}; // { img_id: "https://i.ibb.co/..." }

    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        try {
          // img.data is a full data URL like "data:image/jpeg;base64,/9j/..."
          // imgbb expects just the base64 part (after the comma)
          const base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;

          if (IMGBB_API_KEY) {
            // Upload to imgbb
            const formData = new URLSearchParams();
            formData.append('key', IMGBB_API_KEY);
            formData.append('image', base64Data);
            formData.append('name', img.name || `email_image_${img.id}`);

            const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
              method: 'POST',
              body: formData,
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              if (uploadData.success && uploadData.data?.url) {
                imageUrlMap[img.id] = uploadData.data.url;
                console.log(`✅ Image ${img.id} uploaded: ${uploadData.data.url}`);
              } else {
                console.error(`imgbb upload failed for ${img.id}:`, uploadData);
                // Fallback: embed as base64 (may be blocked by some clients but works in others)
                imageUrlMap[img.id] = img.data;
              }
            } else {
              console.error(`imgbb HTTP error for ${img.id}:`, uploadRes.status);
              imageUrlMap[img.id] = img.data; // fallback
            }
          } else {
            // No imgbb key — embed base64 directly (works in some clients like Apple Mail)
            console.warn('No IMGBB_API_KEY set — embedding base64 image directly');
            imageUrlMap[img.id] = img.data;
          }
        } catch (imgErr) {
          console.error(`Error uploading image ${img.id}:`, imgErr);
          imageUrlMap[img.id] = img.data; // fallback to base64
        }
      }
    }

    // ─── STEP 2: Build link map ────────────────────────────────────────────────
    const linkMap = {}; // { link_id: { text, url } }
    if (links && Array.isArray(links)) {
      links.forEach(link => {
        linkMap[link.id] = link;
      });
    }

    // ─── STEP 3: Process body — replace markers with real HTML ────────────────
    let htmlBody = body;

    // Replace [IMAGE:img_id] with <img> pointing to uploaded URL
    htmlBody = htmlBody.replace(/\[IMAGE:([^\]]+)\]/g, (match, imgId) => {
      const url = imageUrlMap[imgId];
      if (url) {
        return `
          <div style="margin: 16px 0; text-align: left;">
            <img
              src="${url}"
              alt="Image"
              style="max-width: 100%; height: auto; border-radius: 8px; display: block; border: 0;"
            />
          </div>
        `;
      }
      return ''; // remove marker if no image found
    });

    // Replace [LINK:link_id] with a real <a> hyperlink
    htmlBody = htmlBody.replace(/\[LINK:([^\]]+)\]/g, (match, linkId) => {
      const linkData = linkMap[linkId];
      if (linkData) {
        return `<a href="${linkData.url}" style="color: #4F46E5; text-decoration: underline; font-weight: 600;" target="_blank" rel="noopener noreferrer">${linkData.text}</a>`;
      }
      return match; // keep marker text if link data missing
    });

    // Convert plain-text line breaks to paragraphs, preserving existing HTML tags
    const lines = htmlBody.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<br style="line-height: 1.6;">';
      // Don't wrap lines that are already HTML block elements
      if (trimmed.startsWith('<div') || trimmed.startsWith('<p') || trimmed.startsWith('<img') || trimmed.startsWith('<a') || trimmed.startsWith('<br')) {
        return trimmed;
      }
      return `<p style="margin: 0 0 12px 0; line-height: 1.6;">${trimmed}</p>`;
    });
    htmlBody = processedLines.join('\n');

    // ─── STEP 4: Build plain-text fallback (strip HTML, remove markers) ───────
    let plainText = body
      .replace(/\[IMAGE:[^\]]+\]/g, '[Image]')
      .replace(/\[LINK:([^\]]+)\]/g, (match, linkId) => {
        const linkData = linkMap[linkId];
        return linkData ? `${linkData.text} (${linkData.url})` : match;
      });

    // ─── STEP 5: Determine sender ─────────────────────────────────────────────
    let senderEmail = 'onboarding@resend.dev';
    if (fromEmail && fromEmail.includes('@') && !fromEmail.includes('@mikrocrm.app')) {
      senderEmail = fromEmail;
    }
    const senderName = fromName || 'Micro CRM';
    const replyTo = replyToEmail || senderEmail;

    console.log('Email config:', { from: `${senderName} <${senderEmail}>`, replyTo, to });

    // ─── STEP 6: Build final HTML email ───────────────────────────────────────
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
    <style>
      body, html {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 15px;
        line-height: 1.6;
        color: #1a1a1a;
        background-color: #f9f9f9;
      }
      .wrapper {
        width: 100%;
        background-color: #f9f9f9;
        padding: 32px 16px;
      }
      .email-body {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        padding: 40px 36px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }
      p { margin: 0 0 12px 0; line-height: 1.6; }
      a { color: #4F46E5; text-decoration: underline; font-weight: 600; }
      img { max-width: 100%; height: auto; display: block; border: 0; }
      .footer {
        max-width: 600px;
        margin: 16px auto 0;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="email-body">
        ${htmlBody}
      </div>
      <div class="footer">
        <p>Sent via Micro CRM</p>
      </div>
    </div>
  </body>
</html>`;

    // ─── STEP 7: Send via Resend ───────────────────────────────────────────────
    const emailPayload = {
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject,
      html: fullHtml,
      text: plainText,
      reply_to: replyTo
    };

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
      console.error('Resend error:', { status: response.status, error: data });
      return res.status(response.status).json({
        error: 'Failed to send email',
        details: data,
        message: data.message || 'Email service error'
      });
    }

    console.log('✅ Email sent:', data.id);
    return res.status(200).json({ success: true, emailId: data.id, to, subject });

  } catch (error) {
    console.error('Error in send-email:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}