# 💰 SpendSmart — AI-Powered Expense Tracker

> Built by **Muthukumar C** · Full Stack Developer | AI-Integrated Web Applications  
> Tech: **Python · Flask · SQLite · HTML5 · CSS3 · JavaScript · Chart.js · Groq LLaMA API**

---

## ✨ Features

- 🔐 **User Auth** — Register, login, logout with hashed passwords (Werkzeug)
- 💸 **Expense CRUD** — Add & delete expenses (title, amount, category, date, note)
- 📊 **Dashboard Stats** — Total spent, this month, transaction count
- 🍩 **Category Chart** — Doughnut + Bar charts via Chart.js
- 🤖 **AI Insights** — Groq LLaMA API analyzes your spending, gives personalized tips
- 📱 **Responsive UI** — Works on desktop and mobile

---

## 🗂 Project Structure

```
spendsmart/
├── backend/                 # Flask API server
│   ├── app.py               # Main Flask app (routes, models, AI)
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   └── .gitignore
│
├── frontend/                # Vanilla HTML/CSS/JS
│   ├── index.html           # Single page entry
│   ├── vercel.json          # Vercel deployment config
│   ├── css/
│   │   └── style.css        # All styles (dark luxury theme)
│   └── js/
│       ├── config.js        # ← EASY TO CHANGE: API URL, currency, categories
│       ├── api.js           # API helper functions
│       └── app.js           # All app logic, routing, charts
│
└── README.md
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Python 3.10+
- A free [Groq API key](https://console.groq.com) (for AI insights)
- VS Code + Live Server extension (for frontend)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/muthukumar-955/spendsmart.git
cd spendsmart
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
```

**Edit `.env`:**
```env
SECRET_KEY=any-random-string-here
DATABASE_URL=sqlite:///spendsmart.db
GROQ_API_KEY=gsk_your_groq_key_here
FRONTEND_URL=http://localhost:5500
PORT=5000
FLASK_DEBUG=true
```

> **Get Groq API Key FREE:** Go to [console.groq.com](https://console.groq.com) → Sign up → API Keys → Create key

```bash
# Run backend
python app.py
```
Backend runs at: **http://localhost:5000**

---

### Step 3 — Frontend Setup

Open `frontend/js/config.js` — confirm API_BASE is set to local:
```js
API_BASE: 'http://localhost:5000',   // ← local development
```

**Option A — VS Code Live Server:**
- Install "Live Server" extension in VS Code
- Right-click `frontend/index.html` → "Open with Live Server"
- Opens at: **http://localhost:5500**

**Option B — Python HTTP server:**
```bash
cd frontend
python -m http.server 5500
```
Open: **http://localhost:5500**

---

## 🔧 Easy Customization (`frontend/js/config.js`)

```js
const CONFIG = {
  API_BASE:   'http://localhost:5000',  // ← Backend URL
  CURRENCY:   '₹',                      // ← Change to $, €, £ etc.
  CATEGORIES: [                          // ← Add/remove categories
    'Food & Dining',
    'Transportation',
    // ... add your own
  ],
};
```

---

## 🚀 Deploy to Production

### Backend → Render.com

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
5. **Environment Variables** (add these):

| Key | Value |
|-----|-------|
| `SECRET_KEY` | any-random-string |
| `GROQ_API_KEY` | your groq key |
| `FRONTEND_URL` | https://your-app.vercel.app |
| `FLASK_DEBUG` | false |

6. Click **Deploy** → Copy the Render URL (e.g., `https://spendsmart-api.onrender.com`)

---

### Frontend → Vercel.com

1. Update `frontend/js/config.js`:
```js
API_BASE: 'https://spendsmart-api.onrender.com',  // ← Your Render URL
```

2. Commit & push to GitHub

3. Go to [vercel.com](https://vercel.com) → New Project → Import repo
4. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Other
5. Click **Deploy** → Your live URL is ready!

---

## 🔑 Environment Variables Reference

### Backend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Flask session secret | `my-secret-key-2026` |
| `DATABASE_URL` | Database connection | `sqlite:///spendsmart.db` |
| `GROQ_API_KEY` | Groq AI API key | `gsk_xxxxx` |
| `FRONTEND_URL` | CORS allowed origin | `https://yourapp.vercel.app` |
| `PORT` | Server port | `5000` |
| `FLASK_DEBUG` | Debug mode | `false` (production) |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Create account | No |
| POST | `/api/login` | Login | No |
| POST | `/api/logout` | Logout | No |
| GET | `/api/me` | Current user | ✅ |
| GET | `/api/expenses` | List all expenses | ✅ |
| POST | `/api/expenses` | Add expense | ✅ |
| DELETE | `/api/expenses/:id` | Delete expense | ✅ |
| GET | `/api/stats` | Dashboard stats | ✅ |
| GET | `/api/ai-insights` | Groq AI analysis | ✅ |
| GET | `/api/health` | Health check | No |

---

## 🤖 AI Insights (Groq LLaMA)

The AI analyzes your last 30 expenses and gives:
- Personalized spending tips
- Category-wise advice
- Saving suggestions

**Get free API key:** [console.groq.com](https://console.groq.com) — No credit card needed!

---

## 👨‍💻 About

**Muthukumar C** — Full Stack Developer | AI-Integrated Web Applications  
📧 cmuthukumar955@gmail.com  
🔗 [linkedin.com/in/cmuthukumar](https://linkedin.com/in/cmuthukumar)  
🐙 [github.com/muthukumar-955](https://github.com/muthukumar-955)  
📍 Coimbatore, Tamil Nadu

---

## 📄 License

MIT License — Free to use and modify.
