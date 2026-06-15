const express = require('express');
const router  = express.Router();
const {
  analyzeProfile, listProfiles, getProfile,
  removeProfile, getOverallStats, compareGitHubProfiles,
  checkRateLimit, batchAnalyze, refreshProfile, getByTier
} = require('../controllers/profileController');

// ─── Analyze ─────────────────────────────────────────────────────────────────
// POST /api/analyze/:username      →  Fetch from GitHub & store (smart cache)
// POST /api/analyze/batch          →  Analyze up to 10 users in one call
router.post('/analyze/batch', batchAnalyze);
router.post('/analyze/:username', analyzeProfile);

// ─── Profiles ────────────────────────────────────────────────────────────────
// GET    /api/profiles             →  List all stored profiles (paginated)
// GET    /api/profiles/compare     →  Compare multiple profiles (?users=a,b,c)
// GET    /api/profiles/tier/:tier  →  Filter by developer tier (LEGEND, EXPERT…)
// GET    /api/profiles/:username   →  Get one profile with full insights
// DELETE /api/profiles/:username   →  Remove a profile from DB
// PUT    /api/profiles/:username/refresh → Force re-fetch from GitHub
router.get('/profiles', listProfiles);
router.get('/profiles/compare', compareGitHubProfiles);
router.get('/profiles/tier/:tier', getByTier);
router.get('/profiles/:username', getProfile);
router.delete('/profiles/:username', removeProfile);
router.put('/profiles/:username/refresh', refreshProfile);

// ─── Extras ──────────────────────────────────────────────────────────────────
// GET /api/stats        →  Overall analytics (top users, languages, etc.)
// GET /api/rate-limit   →  Check remaining GitHub API calls
router.get('/stats', getOverallStats);
router.get('/rate-limit', checkRateLimit);

module.exports = router;

