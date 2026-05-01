
const express  = require('express');
const axios    = require('axios');
const mongoose = require('mongoose');
const { ReadHistory, SavedArticle } = require('../db/models');
const { protect } = require('../middleware/auth');
const router   = express.Router();

const toObjId = (id) => new mongoose.Types.ObjectId(String(id));

async function callMistral(prompt, maxTokens = 300) {
  const response = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    { model: 'mistral-small-latest', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.7 },
    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` } }
  );
  return response.data.choices?.[0]?.message?.content || null;
}

router.post('/summarize', protect, async (req, res) => {
  try {
    const { title, description, content } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    const text   = [title, description, content].filter(Boolean).join(' ');
    const prompt = `Summarize this news article in exactly 3 short bullet points. Be concise and factual.\n\nArticle: ${text.substring(0, 1000)}\n\nFormat:\n• [point 1]\n• [point 2]\n• [point 3]`;
    const summary = await callMistral(prompt, 200) || 'Could not generate summary.';
    res.json({ success: true, summary });
  } catch (err) {
    console.error('Summarize error:', err.response?.data?.message || err.message);
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
});

router.get('/insights', protect, async (req, res) => {
  try {
    const userId = toObjId(req.user.id);

    const topicAgg = await ReadHistory.aggregate([
      { $match: { user_id: userId, topic: { $ne: null } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const totalSaved = await SavedArticle.countDocuments({ user_id: userId });
    const totalRead  = topicAgg.reduce((s, t) => s + t.count, 0);
    const favTopic   = topicAgg[0]?._id || 'N/A';
    const topics     = topicAgg.slice(0, 5).map(t => ({ topic: t._id, count: t.count }));

    if (!topicAgg.length) {
      return res.json({
        success: true,
        data: {
          insight: "You haven't read any articles yet! Start exploring news to get personalized AI insights. 📰",
          stats: { total_saved: totalSaved, total_read: 0, fav_topic: 'N/A' },
          topics: []
        }
      });
    }

    const topicList = topics.map(t => `${t.topic}: ${t.count} articles`).join(', ');
    const prompt    = `You are a news reading analyst. Based on this user reading habits, give a short fun analysis in 3-4 sentences.\n\nReading data: ${topicList}\nTotal read: ${totalRead}\nTotal saved: ${totalSaved}\nFavourite topic: ${favTopic}\n\nAnalyze their interests and give one recommendation.`;
    const insight   = await callMistral(prompt, 300) || 'Could not generate insights.';

    res.json({
      success: true,
      data: { insight, stats: { total_saved: totalSaved, total_read: totalRead, fav_topic: favTopic }, topics }
    });
  } catch (err) {
    console.error('Insights error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
