# 🏔️ מסלול טיולים אפקה 2026 — TravelAfeka2026

AI-powered hiking & biking itinerary planner built with **Next.js**, **Express**, and **MongoDB**.

Generate multi-day trek or cycling routes for any city in the world — complete with interactive maps, real trail paths, weather forecasts, and AI-written day-by-day plans.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Itinerary Generation** | LLM-powered trip planning (Groq / Gemini / OpenAI) |
| 🗺️ **Interactive Maps** | Leaflet.js with real road/trail routing via OSRM |
| 🌤️ **Live Weather** | 3-day forecast from OpenWeatherMap (or mock data) |
| 🔐 **JWT Authentication** | Register/login with bcrypt + silent refresh |
| 💾 **Save & History** | Save trips to MongoDB, view them later with fresh weather |
| 🚴 **Trek & Bike Modes** | Circular hiking (5–10 km/day) or point-to-point cycling (30–70 km/day) |

---

## 🏗️ Architecture

```
┌────────────────────┐     ┌────────────────────┐     ┌──────────────┐
│      Vercel         │────▶│      Render         │────▶│  MongoDB     │
│   Next.js Frontend  │     │  Express Auth Server│     │    Atlas     │
│   (Port 3000)       │     │   (Port 5001)       │     │              │
├────────────────────┤     ├────────────────────┤     └──────────────┘
│ • Planning Page     │     │ • User Registration │
│ • History Page      │     │ • JWT Auth + Refresh│
│ • Trip API (AI+Map) │     │ • Trip CRUD API     │
│ • Weather API       │     │ • Token Validation  │
│ • JWT Middleware     │     │                     │
└────────────────────┘     └────────────────────┘
```

**Two-server design:** The Express server handles authentication and database persistence. The Next.js server handles the UI, AI generation, mapping, and weather — proxying auth/trip requests to Express.

---

## 📁 Project Structure

```
TravelAfeka2026/
├── auth-server/                 # Express authentication & trips server
│   └── src/
│       ├── config/db.js         # MongoDB connection
│       ├── controllers/         # Auth controller logic
│       ├── middleware/           # JWT auth & validation middleware
│       ├── models/
│       │   ├── User.js          # User schema (bcrypt hashed)
│       │   └── Trip.js          # Saved trip schema
│       ├── routes/
│       │   ├── authRoutes.js    # /api/auth/* endpoints
│       │   └── tripRoutes.js    # /api/trips/* endpoints
│       ├── utils/               # Token utilities
│       └── index.js             # Express entry point
│
├── frontend/                    # Next.js application
│   └── src/
│       ├── app/
│       │   ├── api/trip/        # AI trip generation endpoint
│       │   ├── api/weather/     # Weather proxy endpoint
│       │   ├── api/trips/       # Trip save/list/delete proxy
│       │   ├── planning/        # Trip planning page
│       │   ├── history/         # Saved trips history page
│       │   ├── login/           # Login page
│       │   └── register/        # Registration page
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── TripMap.tsx      # Leaflet map component
│       │   ├── TripResult.tsx   # Full trip display
│       │   └── WeatherCard.tsx  # 3-day forecast card
│       ├── contexts/AuthContext.tsx
│       ├── lib/auth.ts          # Auth API client
│       ├── types/trip.ts        # TypeScript interfaces
│       └── middleware.ts        # JWT route protection
│
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (`mongod`) — or a MongoDB Atlas connection string
- At least one AI API key (Groq recommended — free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/TravelAfeka2026.git
cd TravelAfeka2026
```

### 2. Set Up the Auth Server (Express)

```bash
cd auth-server
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/travel-afeka
JWT_SECRET=<generate-a-strong-secret>
JWT_REFRESH_SECRET=<generate-another-strong-secret>
CLIENT_URL=http://localhost:3000
```

Start the server:

```bash
npm run dev
```

### 3. Set Up the Frontend (Next.js)

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
AUTH_SERVER_URL=http://localhost:5001
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:5001
GROQ_API_KEY=<your-groq-api-key>
```

Start the dev server:

```bash
npm run dev
```

### 4. Open the App

Visit **http://localhost:3000** — register a new account and start planning trips!

---

## 🔑 Environment Variables Reference

### Auth Server (`auth-server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5001`) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret key for refresh tokens |
| `JWT_EXPIRES_IN` | No | Access token expiry (default: `24h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: `7d`) |
| `DEVELOPERS` | No | Developer names embedded in JWT |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SERVER_URL` | ✅ | Express server URL (server-side) |
| `NEXT_PUBLIC_AUTH_SERVER_URL` | ✅ | Express server URL (client-side) |
| `GROQ_API_KEY` | ⭐ | Groq API key (recommended, free) |
| `OPENAI_API_KEY` | ⭐ | OpenAI API key (fallback) |
| `GEMINI_API_KEY` | ⭐ | Google Gemini API key (fallback) |
| `OPENWEATHER_API_KEY` | No | OpenWeatherMap key (uses mock if empty) |

> ⭐ At least one AI API key is required. The system tries them in order: Groq → OpenAI → Gemini.

---

## ☁️ Cloud Deployment Guide

### Step 1: MongoDB Atlas (Free Tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **Shared Cluster** (M0 free tier)
3. Under **Database Access**, create a database user with a password
4. Under **Network Access**, add `0.0.0.0/0` to allow connections from anywhere
5. Click **Connect → Drivers** and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/travel-afeka?retryWrites=true&w=majority
   ```

### Step 2: Deploy Express Auth Server to Render

1. Go to [render.com](https://render.com) and sign up (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure the service:
   - **Name:** `travelafeka-auth`
   - **Root Directory:** `auth-server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
5. Add **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | A strong random secret |
   | `JWT_REFRESH_SECRET` | Another strong random secret |
   | `CLIENT_URL` | `https://your-app.vercel.app` (set after Vercel deploy) |
   | `NODE_ENV` | `production` |

6. Click **Create Web Service** and wait for the deploy to finish
7. Note your Render URL (e.g. `https://travelafeka-auth.onrender.com`)

### Step 3: Deploy Next.js Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Import Project** and select your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detected)
4. Add **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `AUTH_SERVER_URL` | Your Render URL (e.g. `https://travelafeka-auth.onrender.com`) |
   | `NEXT_PUBLIC_AUTH_SERVER_URL` | Same Render URL |
   | `GROQ_API_KEY` | Your Groq API key |
   | `GEMINI_API_KEY` | Your Gemini key (optional) |
   | `OPENWEATHER_API_KEY` | Your OpenWeatherMap key (optional) |

5. Click **Deploy**

### Step 4: Update CORS

After Vercel is deployed, go back to Render and update the `CLIENT_URL` environment variable to your Vercel URL (e.g. `https://travel-afeka.vercel.app`).

---

## 📡 API Reference

### Auth Server Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and get JWT |
| POST | `/api/auth/refresh` | Cookie | Silent token refresh |
| POST | `/api/auth/logout` | No | Clear refresh cookie |
| GET | `/api/auth/profile` | Bearer | Get user profile |
| GET | `/api/auth/validate` | Bearer | Validate access token |

### Trip Endpoints (`/api/trips`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/trips` | Bearer | Save a trip |
| GET | `/api/trips` | Bearer | List user's saved trips |
| DELETE | `/api/trips/:id` | Bearer | Delete a saved trip |

### Next.js API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trip` | Generate AI itinerary |
| GET | `/api/weather` | Fetch 3-day weather forecast |
| POST | `/api/trips` | Proxy: save trip |
| GET | `/api/trips` | Proxy: list trips |
| DELETE | `/api/trips/:id` | Proxy: delete trip |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express.js 4, Node.js |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT (access + refresh), bcrypt |
| Maps | Leaflet.js + React-Leaflet, OSRM routing |
| AI | Groq (Llama 3.3), Google Gemini, OpenAI GPT |
| Geocoding | Nominatim (OpenStreetMap) |
| Weather | OpenWeatherMap API |
| Hosting | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## 👨‍💻 Developers

- **Roi** — Afeka College of Engineering

---


