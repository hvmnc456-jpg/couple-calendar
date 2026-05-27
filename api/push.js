const webpush = require('web-push');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID keys not configured on server' });
  }

  try {
    webpush.setVapidDetails('mailto:hvmnc456@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    return res.status(500).json({ error: 'VAPID init failed: ' + e.message });
  }

  const { subscription, title, body } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: title || '우리 캘린더 🌸', body: body || '', url: '/' })
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    // 410 = subscription expired/unsubscribed
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};
