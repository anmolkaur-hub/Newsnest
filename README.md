# NewsNest 📰

AI-powered news aggregator with personalized insights.

---

## Bugs Fixed

| Issue | Fix |
|---|---|
| CORS error on API calls | Added proper `cors()` config with `origin: '*'` and OPTIONS preflight handler |
| `vercel.json` not building correctly | Added `"builds"` block with `@vercel/node` |
| `app.listen()` crashes on Vercel | Server now detects `process.env.VERCEL` and exports the app instead of listening |
| Frontend hardcoded Vercel URL | `api.js` now auto-detects local vs production and uses relative `/api` path |
| NewsAPI blocked on server-side | Switched to **GNews API** (free, works server-side — get key at gnews.io) |
| favicon.ico 404 | Added `favicon.ico` and `<link rel="icon">` in all HTML pages |

---

## Local Development

```bash
cd backend
npm install
# Add your keys to .env (see .env.example)
npm run dev
```

Open http://localhost:3000

---

## Getting a GNews API Key (replaces NewsAPI)

NewsAPI's free plan **blocks server-side requests** — it only works from `localhost` in a browser.  
GNews is a drop-in replacement that works from any server.

1. Go to **https://gnews.io**
2. Sign up free (100 requests/day on free plan)
3. Copy your API key
4. Paste it as `NEWS_API_KEY` in your `.env` and Vercel environment variables

---

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git add .
git commit -m "fix: CORS, serverless, news API"
git push
```

### Step 2 — Import on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Set **Root Directory** to `backend`
4. Add these **Environment Variables**:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `newsnest_jwt_secret_2025` (or change it) |
| `NEWS_API_KEY` | Your GNews API key |
| `MISTRAL_API_KEY` | Your Mistral API key |

5. Click **Deploy** ✅

### Step 3 — Update frontend (if hosting frontend separately)
If you host frontend on a different domain, update the CORS origin in `server.js`:
```js
app.use(cors({ origin: 'https://your-frontend-domain.com' }));
```

---

## Project Structure

```
newsnest/
├── backend/
│   ├── server.js          # Express app (Vercel-compatible)
│   ├── vercel.json        # Vercel build config
│   ├── .env               # Local env vars (never commit this)
│   ├── .env.example       # Template
│   ├── routes/
│   │   ├── auth.js        # Login / signup
│   │   ├── news.js        # GNews API + save/read history
│   │   └── ai.js          # Mistral summarize + insights
│   ├── db/
│   │   ├── index.js       # MongoDB connection
│   │   └── models.js      # User, SavedArticle, ReadHistory, Topic
│   └── middleware/
│       └── auth.js        # JWT protect middleware
└── frontend/
    ├── favicon.ico
    ├── css/style.css
    ├── js/api.js          # Auto-detects local vs production API URL
    └── pages/
        ├── login.html
        ├── signup.html
        ├── dashboard.html
        ├── saved.html
        └── insights.html
```
