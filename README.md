# GitHub Profile Analyzer API

![GitHub Profile Analyzer API](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![GitHub API](https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

> **Backend service that analyzes GitHub user profiles using the GitHub Public API and stores useful insights in a MySQL database.**

---

## 🌐 Live Demo

| | Link |
|---|---|
| 🚀 **Live API** | [https://github-analyzer-api-u7m7.onrender.com](https://github-analyzer-api-u7m7.onrender.com) |
| 📂 **Source Code** | [https://github.com/Shivprasadpravindongapure/github-analyzer-api](https://github.com/Shivprasadpravindongapure/github-analyzer-api) |
| 📮 **Postman Collection** | [View & Test All Endpoints](https://prasaddongapure7660-9795345.postman.co/workspace/Prasad-Dongapure's-Workspace~ff366df9-d1bc-4e4a-8db4-85aa6b0314e9/collection/49138759-873bb1c3-e395-4977-9765-d124a6033346?action=share&creator=49138759) |

> ⚠️ **Note:** Hosted on Render free tier — first request after inactivity may take ~30 seconds to wake up.

---

## 🎯 Objective

Build a backend service that:
- Fetches public profile data from GitHub using a username
- Stores useful insights (public repos count, followers, stars, languages, etc.) in MySQL
- Provides RESTful API endpoints for analysis, comparison, and statistics

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework & REST API |
| **MySQL** (Clever Cloud) | Cloud database storage |
| **mysql2** | Promise-based MySQL client |
| **GitHub Public API** | Data source for profiles |
| **Render** | Live deployment hosting |

---

## ✨ Features

### Required Features ✅
- Fetch public profile data from GitHub by username
- Store insights: public repo count, followers, following, stars, forks, languages
- RESTful API with full CRUD operations
- Pagination, sorting, filtering on profile list

### Extra Standout Features 🌟

#### 1. 👑 Developer Tier & Badge System
Automatically ranks every analyzed developer into one of **6 tiers** based on a weighted algorithm:

| Tier | Score Range | Description |
|------|-------------|-------------|
| 🌱 **BEGINNER** | 0 - 19 | Early stage developer |
| ⚡ **RISING_STAR** | 20 - 39 | Up-and-coming developer |
| 🔥 **INTERMEDIATE** | 40 - 59 | Growing developer |
| 💎 **ADVANCED** | 60 - 79 | Skilled open source contributor |
| 🚀 **EXPERT** | 80 - 94 | Highly experienced developer |
| 👑 **LEGEND** | 95 - 100 | Iconic developer (e.g. torvalds, sindresorhus) |

**Formula:**
```
combined_score = (activity_score × 0.35) + (influence_score × 0.35)
               + (min(100, followers/100) × 0.20)
               + (min(100, public_repos×2) × 0.10)
```

#### 2. 📦 Batch Analyze
Analyze up to **10 GitHub profiles in a single API call**.

#### 3. ⚡ Smart Caching
Returns cached data if profile was analyzed within **60 minutes** — saves GitHub API quota. Use `?force=true` to bypass.

#### 4. 🔄 Force Refresh
`PUT /api/profiles/:username/refresh` — Re-fetches fresh data from GitHub without deleting existing record.

#### 5. 🏆 Filter by Developer Tier
`GET /api/profiles/tier/LEGEND` — Query all profiles of a specific tier sorted by combined score.

---

## 📡 API Endpoints

### Base URL
```
https://github-analyzer-api-u7m7.onrender.com
```

### Health Check
```http
GET /
```
Returns API status and list of all available endpoints.

---

### Analyze Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze/:username` | Analyze a GitHub profile (with smart cache) |
| `POST` | `/api/analyze/:username?force=true` | Force re-fetch from GitHub |
| `POST` | `/api/analyze/batch` | Analyze up to 10 profiles in one call |

**Batch Analyze Body:**
```json
{
  "usernames": ["torvalds", "gaearon", "sindresorhus"]
}
```

**Sample Response — Analyze Profile:**
```json
{
  "success": true,
  "message": "Profile for 'torvalds' analyzed and stored successfully.",
  "cached": false,
  "data": {
    "username": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 12,
    "followers": 307430,
    "top_language": "C",
    "total_stars_received": 248924,
    "activity_score": "100.00",
    "influence_score": "100.00",
    "developer_tier": "EXPERT",
    "developer_badge": "Expert",
    "combined_score": "92.40",
    "topRepos": [
      {
        "repo_name": "linux",
        "description": "Linux kernel source tree",
        "language": "C",
        "stars": 236469,
        "forks": 62714,
        "repo_url": "https://github.com/torvalds/linux"
      }
    ],
    "languages": [
      { "language": "C", "repo_count": 10 }
    ]
  }
}
```

---

### Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profiles` | List all profiles (paginated) |
| `GET` | `/api/profiles/:username` | Get full profile with insights |
| `PUT` | `/api/profiles/:username/refresh` | Force re-fetch from GitHub |
| `DELETE` | `/api/profiles/:username` | Delete a profile from DB |
| `GET` | `/api/profiles/compare?users=a,b,c` | Compare multiple profiles |
| `GET` | `/api/profiles/tier/:tier` | Filter profiles by developer tier |

**Query Params for List:**
```
?page=1&limit=10&sort=followers&order=DESC
```

---

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats` | Overall analytics & top users |
| `GET` | `/api/rate-limit` | Check GitHub API rate limit |

---

## 🗄️ Database Schema

```sql
github_profiles        -- Main profile data (username, bio, followers, etc.)
github_repositories    -- All public repos per profile
profile_insights       -- Computed analytics + developer tier/badge
profile_languages      -- Language breakdown per profile
```

**Key Insight Fields Stored:**
- `total_stars_received` — Sum of stars across all repos
- `total_forks_received` — Sum of forks across all repos
- `top_language` — Most used programming language
- `language_diversity_count` — Number of distinct languages used
- `activity_score` — Repo activity metric (0-100)
- `influence_score` — Star/fork influence metric (0-100)
- `developer_tier` — BEGINNER / RISING_STAR / INTERMEDIATE / ADVANCED / EXPERT / LEGEND
- `developer_badge` — Human-readable badge label
- `combined_score` — Overall weighted developer score (0-100)

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### 1. Clone the Repository
```bash
git clone https://github.com/Shivprasadpravindongapure/github-analyzer-api
cd github-analyzer-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development

# GitHub API
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_API_URL=https://api.github.com

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=github_analyzer
```

### 4. Setup Database
```bash
npm run setup-db
```

### 5. Start Server
```bash
npm run dev
```

API is running at: `http://localhost:3000`

---

## 📮 Testing with Postman

Import the collection and test all endpoints:

**[🔗 Open Postman Collection](https://prasaddongapure7660-9795345.postman.co/workspace/Prasad-Dongapure's-Workspace~ff366df9-d1bc-4e4a-8db4-85aa6b0314e9/collection/49138759-873bb1c3-e395-4977-9765-d124a6033346?action=share&creator=49138759)**

Or import `postman_collection.json` from this repo manually.

### Quick Test via cURL

```bash
# Health check
curl https://github-analyzer-api-u7m7.onrender.com/

# Analyze a profile
curl -X POST https://github-analyzer-api-u7m7.onrender.com/api/analyze/torvalds

# Get profile with insights
curl https://github-analyzer-api-u7m7.onrender.com/api/profiles/torvalds

# Batch analyze
curl -X POST https://github-analyzer-api-u7m7.onrender.com/api/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{"usernames":["torvalds","gaearon","sindresorhus"]}'

# Filter by tier
curl https://github-analyzer-api-u7m7.onrender.com/api/profiles/tier/LEGEND

# Compare profiles
curl "https://github-analyzer-api-u7m7.onrender.com/api/profiles/compare?users=torvalds,sindresorhus"

# Stats
curl https://github-analyzer-api-u7m7.onrender.com/api/stats
```

---

## 📁 Project Structure

```
github-profile-analyzer/
├── src/
│   ├── controllers/
│   │   └── profileController.js    # Request handlers
│   ├── models/
│   │   └── profileModel.js         # DB queries + tier system
│   ├── routes/
│   │   └── profileRoutes.js        # API route definitions
│   ├── services/
│   │   └── githubService.js        # GitHub API integration
│   ├── database/
│   │   ├── db.js                   # MySQL connection pool
│   │   ├── setup.js                # Table creation script
│   │   └── migrate.js              # DB migration script
│   ├── middleware/
│   │   ├── errorHandler.js         # Global error handling
│   │   └── rateLimiter.js          # API rate limiting
│   └── server.js                   # Express app entry point
├── database/
│   └── schema.sql                  # Full database schema
├── postman_collection.json         # Postman test collection
├── .env.example                    # Environment template
└── README.md
```

---

## 📦 NPM Scripts

```bash
npm run dev        # Start with nodemon (development)
npm start          # Start server (production)
npm run setup-db   # Create database tables
npm run migrate    # Run database migrations
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxx...` |
| `GITHUB_API_URL` | GitHub API base URL | `https://api.github.com` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | ` ` |
| `DB_NAME` | Database name | `github_analyzer` |

---

## 📊 Sample API Responses

### GET /api/stats
```json
{
  "success": true,
  "data": {
    "counts": { "total_profiles": 5, "total_repositories": 156 },
    "topByStars": [
      { "username": "sindresorhus", "total_stars_received": 864911 },
      { "username": "torvalds",     "total_stars_received": 248924 }
    ],
    "topLanguages": [
      { "language": "JavaScript", "count": 3 },
      { "language": "C",          "count": 1 }
    ]
  }
}
```

### GET /api/profiles/tier/LEGEND
```json
{
  "success": true,
  "tier": "LEGEND",
  "total": 3,
  "data": [
    {
      "username": "sindresorhus",
      "developer_tier": "LEGEND",
      "developer_badge": "Legend",
      "combined_score": "100.00",
      "total_stars_received": 864911
    }
  ]
}
```

---

## 🚢 Deployment

This API is deployed on:
- **App Server:** [Render.com](https://render.com) (Free tier)
- **Database:** [Clever Cloud](https://clever-cloud.com) (Free DEV MySQL)

### Deploy Your Own
1. Fork this repo
2. Create a free MySQL on Clever Cloud
3. Deploy on Render with these settings:
   - **Build:** `npm install`
   - **Start:** `npm run setup-db && npm start`
4. Add all environment variables in Render dashboard

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👨‍💻 Author

**Shivprasad Pravindongapure**
- GitHub: [@Shivprasadpravindongapure](https://github.com/Shivprasadpravindongapure)

---

*Built with ❤️ using Node.js, Express.js, MySQL & GitHub API*
