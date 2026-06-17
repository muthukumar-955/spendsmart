// ─── SpendSmart Frontend Config ───────────────────────────────────────────────
// Change API_BASE to your deployed Render URL in production
// Local development: http://localhost:5000
// Production: https://your-app-name.onrender.com

const CONFIG = {
  API_BASE: 'http://localhost:5000',  // ← Change this to Render URL when deploying
  APP_NAME: 'SpendSmart',
  CURRENCY: '₹',                      // ← Change currency symbol here
  CATEGORIES: [                        // ← Add/remove categories here
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Education',
    'Bills & Utilities',
    'Travel',
    'Fitness',
    'Personal Care',
    'Groceries',
    'Other',
  ],
};
