const express  = require('express');
const axios    = require('axios');
const mongoose = require('mongoose');
const { SavedArticle, ReadHistory, Topic } = require('../db/models');
const { protect } = require('../middleware/auth');
const router   = express.Router();

const toObjId = (id) => new mongoose.Types.ObjectId(String(id));

// Map NewsAPI category names → GNews topic names
const GNEWS_TOPIC_MAP = {
  general:       'breaking-news',
  technology:    'technology',
  business:      'business',
  sports:        'sports',
  entertainment: 'entertainment',
  health:        'health',
  science:       'science',
};

// Normalise GNews article shape → NewsAPI-compatible shape
function normaliseGNews(article) {
  return {
    title:       article.title,
    description: article.description,
    url:         article.url,
    urlToImage:  article.image,
    publishedAt: article.publishedAt,
    source:      { name: article.source?.name || 'Unknown' },
    content:     article.content,
  };
}

// GET /api/news
router.get('/', protect, async (req, res) => {
  try {
    const { topic = 'general', q } = req.query;
    const apiKey = process.env.NEWS_API_KEY; // now used as GNews API key

    let articles = [];

    if (q) {
      // Search mode
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=20&apikey=${apiKey}`;
      const response = await axios.get(url);
      articles = (response.data.articles || []).map(normaliseGNews);
    } else {
      // Top headlines by topic
      const gNewsTopic = GNEWS_TOPIC_MAP[topic] || 'breaking-news';
      const url = `https://gnews.io/api/v4/top-headlines?topic=${gNewsTopic}&lang=en&max=20&apikey=${apiKey}`;
      const response = await axios.get(url);
      articles = (response.data.articles || []).map(normaliseGNews);
    }

    articles = articles.filter(a => a.title && a.title !== '[Removed]');
    res.json({ success: true, data: articles });
  } catch (err) {
    console.error('News error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
});

// POST /api/news/read
router.post('/read', protect, async (req, res) => {
  try {
    const { title, url, topic } = req.body;
    await ReadHistory.create({
      user_id: toObjId(req.user.id),
      title,
      url,
      topic: topic || 'general'
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Read error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to log' });
  }
});

// POST /api/news/save
router.post('/save', protect, async (req, res) => {
  try {
    const { title, description, url, urlToImage, sourceName, publishedAt, topic } = req.body;
    await SavedArticle.findOneAndUpdate(
      { user_id: toObjId(req.user.id), url },
      { user_id: toObjId(req.user.id), title, description, url, url_to_image: urlToImage, source_name: sourceName, published_at: publishedAt, topic: topic || 'general' },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Article saved!' });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save' });
  }
});

// GET /api/news/saved
router.get('/saved', protect, async (req, res) => {
  try {
    const articles = await SavedArticle
      .find({ user_id: toObjId(req.user.id) })
      .sort({ saved_at: -1 });
    res.json({ success: true, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get saved' });
  }
});

// DELETE /api/news/saved/:id
router.delete('/saved/:id', protect, async (req, res) => {
  try {
    await SavedArticle.findOneAndDelete({ _id: req.params.id, user_id: toObjId(req.user.id) });
    res.json({ success: true, message: 'Removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove' });
  }
});

// GET /api/news/topics
router.get('/topics', protect, async (req, res) => {
  try {
    const topics = await Topic.find().sort({ name: 1 });
    res.json({ success: true, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get topics' });
  }
});

module.exports = router;
