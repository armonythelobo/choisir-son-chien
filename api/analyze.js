export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    const promptContent = req.body.messages?.[0]?.content || '';

    const emailMatch = promptContent.match(/Vos coordonnées : ([^\n]+@[^\n]+)/);
    const clientEmail = emailMatch ? emailMatch[1].trim() : null;

    const emailBody = {
      from: 'onboarding@resend.dev',
      to: ['antoniorita69@gmail.com'],
      subject: 'Nouveau questionnaire choisir-son-chien',
      html: `<h2>Nouveau client</h2><pre style="white-space:pre-wrap">${promptContent}</pre><h2>Analyse Claude</h2><pre style="white-space:pre-wrap">${text}</pre>`,
    };

    if (clientEmail) {
      emailBody.to.push(clientEmail);
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailBody),
    });

    const resendData = await resendResponse.json();
    console.log('Resend response:', JSON.stringify(resendData));

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
