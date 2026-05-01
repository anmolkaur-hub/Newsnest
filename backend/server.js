const express  = require('express');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const connectDB      = require('./db/index');
const { seedTopics } = require('./db/models');
const authRoutes     = require('./routes/auth');
const newsRoutes     = require('./routes/news');
const aiRoutes       = require('./routes/ai');

const app = express();

// CORS — allow all origins (supports local dev + any deployed frontend)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai',   aiRoutes);

const pages = ['login', 'signup', 'dashboard', 'saved', 'insights'];
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
pages.forEach(p => {
  app.get(`/${p}`, (req, res) => res.sendFile(path.join(__dirname, `../frontend/pages/${p}.html`)));
});

// DB connect once (cached for serverless)
let isConnected = false;
async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    await seedTopics();
    isConnected = true;
  }
}

// For Vercel serverless — export the app
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    await ensureDB();
    return app(req, res);
  };
} else {
  // Local dev — use app.listen
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`📰 NewsNest running on http://localhost:${PORT}`);
    await ensureDB();
  });
}
