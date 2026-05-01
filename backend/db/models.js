const mongoose = require('mongoose');

// ─── USER ───────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// ─── SAVED ARTICLE ──────────────────────────────────
const savedArticleSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  url:          { type: String, required: true },
  url_to_image: { type: String },
  source_name:  { type: String },
  published_at: { type: String },
  topic:        { type: String, default: 'general' },
  ai_summary:   { type: String },
  saved_at:     { type: Date, default: Date.now }
});
// Prevent duplicate saves for same user + url
savedArticleSchema.index({ user_id: 1, url: 1 }, { unique: true });

// ─── READ HISTORY ────────────────────────────────────
const readHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  url:     { type: String, required: true },
  topic:   { type: String, default: 'general' },
  read_at: { type: Date, default: Date.now }
});
readHistorySchema.index({ user_id: 1, topic: 1 });

// ─── TOPIC ───────────────────────────────────────────
const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '📰' }
});

const User         = mongoose.model('User', userSchema);
const SavedArticle = mongoose.model('SavedArticle', savedArticleSchema);
const ReadHistory  = mongoose.model('ReadHistory', readHistorySchema);
const Topic        = mongoose.model('Topic', topicSchema);

// Seed default topics if collection is empty
async function seedTopics() {
  const count = await Topic.countDocuments();
  if (count === 0) {
    await Topic.insertMany([
      { name: 'Technology',   slug: 'technology',   icon: '💻' },
      { name: 'Sports',       slug: 'sports',       icon: '⚽' },
      { name: 'Business',     slug: 'business',     icon: '💼' },
      { name: 'Entertainment',slug: 'entertainment',icon: '🎬' },
      { name: 'Health',       slug: 'health',       icon: '🏥' },
      { name: 'Science',      slug: 'science',      icon: '🔬' },
      { name: 'Politics',     slug: 'general',      icon: '🏛️' },
      { name: 'India',        slug: 'india',        icon: '🇮🇳' },
    ]);
    console.log('✅ Default topics seeded');
  }
}

module.exports = { User, SavedArticle, ReadHistory, Topic, seedTopics };