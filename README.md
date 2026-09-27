# 🛰️ Puga Sutham | Predictive Smoke Drift Early Warning System

> **A satellite-driven, AI-validated threat monitoring platform designed to protect sensitive environmental zones, heritage sites, and populations from agricultural stubble burning and smoke drift.**

---

## 🌪 The Problem
Every year, agricultural stubble burning creates massive toxic smog crises across India, severely impacting public health and deteriorating exposed historical zones (like the Keeladi Excavation Site). Existing systems only report fires *after* the damage is done.

## 🛡 The Solution
**Puga Sutham** acts as a live Predictive Shield. We pull raw **NASA NRT (Near Real-Time) satellite thermal anomalies** and cross-reference them with live meteorological wind vectors to mathematically predict if toxic smoke will cross into a protected geofenced location within a 2-hour window.

### ✨ Key Features
- **NASA FIRMS Integration:** Monitors high-confidence thermal anomalies via VIIRS satellites.
- **Predictive Physics Engine:** Calculates Spherical Trigonometry (Haversine distance) and real-time wind trajectories to forecast exact smoke arrival times (ETA).
- **Ground-Truth AI Override:** Solves satellite delay by allowing citizens to upload photos. An edge-deployed Neural Network (TensorFlow.js) validates the image. A highly-confident "Clear" photo automatically extinguishes NASA alerts, resolving false alarms instantly.
- **Infinite Scalability:** Includes an automated, secure cron-based data pruning engine triggered via GitHub Actions, keeping Database edge queries lightning-fast.

---

## 💻 Tech Stack
- **Frontend / Framework:** Next.js 14 (App Router), React, Tailwind CSS
- **Edge Database:** Turso (libSQL/SQLite)
- **Caching Layer:** Upstash (Serverless Redis) for massive query rate-limiting
- **Machine Learning:** TensorFlow.js (Edge-deployed visual classification)
- **APIs:** NASA FIRMS (Satellites), Open-Meteo (Wind Vectors), OpenStreetMap (Visuals)
- **Deployment:** Cloudflare Pages (Edge) + GitHub Actions CI/CD

---

## 🚀 Google Cloud & GDG Vision (V2 Roadmap)
Our core mathematical engine is complete. With Google Cloud credits and GDG mentorship, our immediate roadmap includes:
1. **Google Vertex AI / Gemini 1.5 Pro:** Replacing our edge classifier with Gemini's multi-modal intelligence to deeply analyze citizen smoke uploads for toxicity profiles.
2. **Google BigQuery:** Archiving millions of NASA fire data points globally to predict seasonal burning trends *before* fires are even lit.
3. **Google Maps Platform:** Replacing OpenStreetMap for enterprise-grade B2B geofencing, allowing Indian hospitals and schools to natively define their own protection boundaries.

---

## 🛠 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/puga-sutham.git
   cd puga-sutham
   ```

2. **Install dependancies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   NASA_FIRMS_MAP_KEY=your_nasa_firms_key
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   TURSO_DATABASE_URL=your_turso_url
   TURSO_AUTH_TOKEN=your_turso_token
   CRON_SECRET=your_secure_password
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the Live Dashboard.
