# SmartCanteen AI 🍱🤖
> **Smart Canteen Management and Food Demand Prediction System**  
> *A College Mini-Project built with React, Vite, FastAPI, Supabase, Scikit-Learn, and Google Gemini AI.*

---

## 📌 Project Overview

**SmartCanteen AI** modernizes college canteen operations by connecting students and canteen administrators in a seamless web platform:
- **For Students**: Digital canteen menu, category filtering, instant cart management, order tracking, and feedback system.
- **For Canteen Admins**: Real-time sales dashboard, inventory control, automated Machine Learning food demand forecasting, preparation quantity recommendations, and an AI operational assistant powered by Google Gemini.

---

## 🚀 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Python 3.10+, FastAPI, Pydantic, Uvicorn
- **Database**: Supabase / PostgreSQL
- **Machine Learning**: Python, Pandas, NumPy, Scikit-learn
- **AI Assistant**: Google Gemini API (`google-genai` SDK)

---

## 📂 Project Structure

```
smart-canteen-ai/
├── backend/            # FastAPI Python REST API & Business Logic
│   ├── app/            # Routers, Schemas, Services, Config
│   ├── requirements.txt
│   └── .env.example
├── frontend/           # React + Vite Single Page Application
│   ├── src/            # Components, Pages, Context, Services
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── ml/                 # ML Synthetic Generator & Demand Predictor Model
│   ├── dataset_generator.py
│   ├── demand_predictor.py
│   ├── train_and_predict.py
│   └── README.md
├── database/           # Database DDL & Seed Data
│   ├── schema.sql
│   └── seed.sql
├── ARCHITECTURE.md     # Comprehensive Technical Architecture & ER Diagram
└── README.md           # Project Documentation & Viva Guide
```

---

## 🛠️ Quick Setup Instructions

### 1. Database Setup (Supabase / PostgreSQL)
1. Open your Supabase project (or local PostgreSQL instance).
2. Go to the SQL Editor.
3. Run `database/schema.sql` to build tables and constraints.
4. Run `database/seed.sql` to populate initial categories, food items, and demo profiles.

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase URL, Key, and Gemini API Key
uvicorn app.main:app --reload --port 8000
```
- Interactive API Documentation available at: `http://localhost:8000/docs`

### 3. Machine Learning Model Execution
```bash
cd ml
# Generate 90-day synthetic sales history & train model:
python train_and_predict.py
```

### 4. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- Open `http://localhost:3000` in your browser.

---

## 🍲 Indian College Canteen Items Included

1. Samosa (₹20)
2. Vada Pav (₹25)
3. Masala Dosa (₹60)
4. Idli Sambar (₹40)
5. Veg Sandwich (₹45)
6. Veg Biryani (₹90)
7. Chicken Biryani (₹130)
8. Pav Bhaji (₹70)
9. Hakka Noodles (₹55)
10. Cutting Chai (₹12)
11. Filter Coffee (₹18)
12. Cold Drink (₹25)

---

## 📊 ML Demand Prediction Feature

- **How it works**: Uses historical daily sales, day-of-week seasonality (e.g. Monday chai rush vs Friday biryani demand), and moving averages to predict tomorrow's demand.
- **Buffer Formula**:  
  $$\text{Recommended Preparation} = \lceil \text{Predicted Demand} \times 1.10 \rceil$$
- **Benefit**: Ensures canteen never runs out of popular items while avoiding food wastage.

---

## 🤖 Admin AI Assistant (Gemini)

Admins can ask natural language questions directly on the dashboard:
- *"What should we prepare tomorrow?"*
- *"Which food items are most popular?"*
- *"Why might food wastage be high?"*
- *"Which items have low stock?"*

The backend injects real-time inventory, sales, and prediction context into Gemini to give tailored answers.

---

## 🎯 Viva Q&A Cheat Sheet

1. **What is the project objective?**  
   To optimize college canteen operations through online ordering for students and AI/ML demand forecasting for canteen management.
2. **What ML algorithm is used and why?**  
   Ridge / Time-Series Regression with lag features. It handles daily time-series data efficiently, avoids overfitting, and executes rapidly.
3. **How is data privacy handled?**  
   Role-based access control (RBAC) separates student ordering rights from admin management capabilities.
