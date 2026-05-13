const express = require('express');
const webpush = require('web-push');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

webpush.setVapidDetails(
  'mailto:plantcare@example.com',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

router.post('/subscribe', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { pushSubscription: req.body });
    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/send', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.pushSubscription) return res.status(400).json({ message: 'No subscription found' });
    await webpush.sendNotification(user.pushSubscription, JSON.stringify({
      title: 'Plant Care Reminder',
      body: req.body.message || 'Time to water your plants!'
    }));
    res.json({ message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;