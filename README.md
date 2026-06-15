# 🔍 GitHub Profile Analyzer API

A powerful backend service built with **Node.js**, **Express.js**, and **MySQL** that analyzes GitHub user profiles using the GitHub Public API and stores detailed insights in a relational database.

---

## ✨ Features

- 🔍 **Fetch & Analyze** any public GitHub profile by username
- 📊 **Stores rich insights**: repos, followers, languages, stars, account age, activity score
- 📋 **List all** analyzed profiles with pagination & sorting
- 👤 **Get single profile** with full details and top repositories
- ⚔️ **Compare profiles** side-by-side
- 📈 **Overall stats** — top users, top languages, totals
- 🛡️ **Rate limiting**, helmet security, CORS enabled
- ⏱️ **GitHub API rate limit checker**

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js    | Runtime environment |
| Express.js | Web framework |
| MySQL / MariaDB | Database |
| GitHub REST API v3 | Data source |
| Axios | HTTP client |
| mysql2 | MySQL driver |
| dotenv | Environment variables |
| helmet | Security headers |
| express-rate-limit | API rate limiting |
| morgan | HTTP request logging |

---

## 📁 Project Structure

```
github-profile-analyzer/
├── src/
│   ├── server.js              # Entry point
│   ├── app.js                 # Express app config
│   ├── routes/
│   │   └── profileRoutes.js   # All API routes
│   ├── controllers/
│   │   └── profileController.js
│   ├── models/
│   │   └── profileModel.js    # DB operations
│   ├── services/
│   │   └── githubService.js   # GitHub API calls
│   ├── middleware/
│   │   └── errorHandler.js    # Global error handler
│   └── database/
│       ├── db.js              # MySQL connection pool
│       └── setup.js           # Auto DB setup script
├── database/
│   └── schema.sql             # SQL schema export
├── postman_collection.json    # Postman collection
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js v16+ installed
- MySQL / MariaDB running (XAMPP works perfectly)
- Git

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd github-profile-analyzer
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Configure Environment Variables

Edit the `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

# GitHub Token (get from https://github.com/settings/tokens)
GITHUB_TOKEN=your_github_token_here
GITHUB_API_URL=https://api.github.com

# MySQL Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=github_analyzer
```

> **XAMPP users**: Leave `DB_PASSWORD` empty (default root has no password).

### Step 4 — Create Database & Tables

Run the auto-setup script:

```bash
npm run setup-db
```

This creates the `github_analyzer` database and all required tables automatically.

### Step 5 — Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server starts at: **http://localhost:3000**

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `POST` | `/api/analyze/:username` | Fetch & store GitHub profile |
| `GET`  | `/api/profiles` | List all stored profiles |
| `GET`  | `/api/profiles/:username` | Get single profile details |
| `DELETE` | `/api/profiles/:username` | Delete a profile |
| `GET`  | `/api/profiles/compare?users=a,b` | Compare profiles |
| `GET`  | `/api/stats` | Overall statistics |
| `GET`  | `/api/rate-limit` | GitHub API rate limit |

### Query Parameters for `GET /api/profiles`

| Param | Default | Options |
|-------|---------|---------|
| `page` | `1` | Any number |
| `limit` | `10` | Any number |
| `sort` | `analyzed_at` | `analyzed_at`, `followers`, `public_repos`, `username` |
| `order` | `DESC` | `ASC`, `DESC` |

---

## 💡 Example Requests

### Analyze a GitHub Profile
```bash
curl -X POST http://localhost:3000/api/analyze/torvalds
```

### List All Profiles
```bash
curl http://localhost:3000/api/profiles?sort=followers&order=DESC
```

### Get Single Profile
```bash
curl http://localhost:3000/api/profiles/torvalds
```

### Compare Profiles
```bash
curl "http://localhost:3000/api/profiles/compare?users=torvalds,gaearon,sindresorhus"
```

### Delete a Profile
```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

## 📊 Stored Insights

| Field | Description |
|-------|-------------|
| `public_repos` | Total public repositories |
| `followers` | Follower count |
| `following` | Following count |
| `top_language` | Most used programming language |
| `language_diversity_count` | Number of distinct languages used |
| `total_stars_received` | Total GitHub stars across all repos |
| `total_forks_received` | Total forks across all repos |
| `avg_stars_per_repo` | Average stars per repository |
| `account_age_days` | Days since account was created |
| `activity_score` | Calculated score (0–100) based on repos & stars |
| `influence_score` | Score (0–100) based on stars & forks |
| `original_repos_count` | Number of original (non-forked) repos |
| `forked_repos_count` | Number of forked repos |

---

## 🗄️ Database Schema

Four tables are used:

- **`github_profiles`** — Core profile data
- **`github_repositories`** — Top public repositories
- **`profile_insights`** — Calculated analytics
- **`profile_languages`** — Language usage breakdown

Full schema available in [`database/schema.sql`](./database/schema.sql)

---

## 🧪 Postman Collection

Import `postman_collection.json` into Postman to get all endpoints pre-configured.

Set the `baseUrl` variable to `http://localhost:3000`.

---

## 🔒 Security

- All requests are rate-limited to **100 per 15 minutes** per IP
- HTTP security headers via **Helmet**
- CORS enabled for cross-origin access
- `.env` file excluded from version control

---

## 📝 License

MIT License
