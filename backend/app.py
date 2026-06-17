from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from groq import Groq
import os
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

app = Flask(__name__)

# ─── Configuration (easy to change) ───────────────────────────────────────────
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'spendsmart-secret-key-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///spendsmart.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

# ─── CORS (update FRONTEND_URL in .env for production) ───────────────────────
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5500')
CORS(app, supports_credentials=True, origins=[
    FRONTEND_URL,
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://spendsmart-ai.vercel.app',
])

db = SQLAlchemy(app)

# ─── Models ───────────────────────────────────────────────────────────────────
class User(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(80), unique=True, nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expenses   = db.relationship('Expense', backref='user', lazy=True, cascade='all, delete-orphan')


class Expense(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title      = db.Column(db.String(200), nullable=False)
    amount     = db.Column(db.Float, nullable=False)
    category   = db.Column(db.String(100), nullable=False)
    date       = db.Column(db.Date, nullable=False)
    note       = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ─── Auth decorator ───────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        username=username,
        email=email,
        password=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({'message': 'Registered successfully', 'username': user.username}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({'message': 'Login successful', 'username': user.username}), 200


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200


@app.route('/api/me', methods=['GET'])
@login_required
def me():
    return jsonify({'user_id': session['user_id'], 'username': session['username']}), 200


# ─── Expense Routes ───────────────────────────────────────────────────────────
@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    expenses = Expense.query.filter_by(user_id=session['user_id'])\
                            .order_by(Expense.date.desc(), Expense.created_at.desc())\
                            .all()
    return jsonify([{
        'id':       e.id,
        'title':    e.title,
        'amount':   e.amount,
        'category': e.category,
        'date':     e.date.isoformat(),
        'note':     e.note,
    } for e in expenses]), 200


@app.route('/api/expenses', methods=['POST'])
@login_required
def add_expense():
    data     = request.get_json()
    title    = data.get('title', '').strip()
    amount   = data.get('amount')
    category = data.get('category', '').strip()
    date_str = data.get('date', '')
    note     = data.get('note', '').strip()

    if not title or not amount or not category or not date_str:
        return jsonify({'error': 'Title, amount, category and date are required'}), 400
    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except ValueError:
        return jsonify({'error': 'Amount must be a positive number'}), 400

    expense = Expense(
        user_id=session['user_id'],
        title=title,
        amount=amount,
        category=category,
        date=datetime.strptime(date_str, '%Y-%m-%d').date(),
        note=note,
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({'message': 'Expense added', 'id': expense.id}), 201


@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=session['user_id']).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


# ─── Stats Route ──────────────────────────────────────────────────────────────
@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    expenses = Expense.query.filter_by(user_id=session['user_id']).all()
    total       = sum(e.amount for e in expenses)
    count       = len(expenses)
    now         = datetime.utcnow()
    this_month  = sum(e.amount for e in expenses
                      if e.date.month == now.month and e.date.year == now.year)

    # Category breakdown
    categories = {}
    for e in expenses:
        categories[e.category] = categories.get(e.category, 0) + e.amount

    # Last 6 months trend
    monthly = {}
    for i in range(5, -1, -1):
        d   = now - timedelta(days=i * 30)
        key = d.strftime('%b %Y')
        monthly[key] = sum(e.amount for e in expenses
                           if e.date.month == d.month and e.date.year == d.year)

    return jsonify({
        'total':      round(total, 2),
        'this_month': round(this_month, 2),
        'count':      count,
        'categories': {k: round(v, 2) for k, v in categories.items()},
        'monthly':    monthly,
    }), 200


# ─── AI Insights Route ────────────────────────────────────────────────────────
@app.route('/api/ai-insights', methods=['GET'])
@login_required
def ai_insights():
    groq_key = os.getenv('GROQ_API_KEY', '')
    if not groq_key:
        return jsonify({'insights': 'AI insights unavailable — GROQ_API_KEY not configured.'}), 200

    expenses = Expense.query.filter_by(user_id=session['user_id'])\
                            .order_by(Expense.date.desc()).limit(30).all()
    if not expenses:
        return jsonify({'insights': 'Add some expenses first to get AI-powered insights!'}), 200

    # Build summary for AI
    total = sum(e.amount for e in expenses)
    cats  = {}
    for e in expenses:
        cats[e.category] = cats.get(e.category, 0) + e.amount

    summary = f"Total spent (last 30 expenses): ₹{total:.2f}\n"
    summary += "Category breakdown:\n"
    for cat, amt in sorted(cats.items(), key=lambda x: -x[1]):
        summary += f"  - {cat}: ₹{amt:.2f} ({amt/total*100:.1f}%)\n"
    summary += "\nRecent expenses:\n"
    for e in expenses[:10]:
        summary += f"  - {e.date}: {e.title} — ₹{e.amount:.2f} [{e.category}]\n"

    prompt = f"""You are a friendly personal finance advisor. Analyze this user's expense data and give 3-4 practical, personalized spending tips. Be specific, encouraging and concise. Use emojis.

{summary}

Give actionable advice in 3-4 bullet points. Keep it under 200 words."""

    try:
        client   = Groq(api_key=groq_key)
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=300,
            temperature=0.7,
        )
        insights = response.choices[0].message.content
    except Exception as e:
        insights = f'AI insights temporarily unavailable. Error: {str(e)}'

    return jsonify({'insights': insights}), 200


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'ts': datetime.utcnow().isoformat()}), 200


# ─── Init DB & Run ────────────────────────────────────────────────────────────
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
