const express = require('express');
const router  = express.Router();
const {
  analyzeProfile,
  listProfiles,
  getProfile,
  removeProfile,
  getOverallStats,
  compareGitHubProfiles,
  checkRateLimit
} = require('../controllers/profileController');

// ─── Analyze ─────────────────────────────────────────────────────────────────
// POST /api/analyze/:username  →  Fetch from GitHub & store in DB
router.post('/analyze/:username', analyzeProfile);

// ─── Profiles ────────────────────────────────────────────────────────────────
// GET  /api/profiles            →  List all stored profiles (paginated)
router.get('/profiles', listProfiles);

// GET  /api/profiles/compare    →  Compare multiple profiles (?users=a,b,c)
router.get('/profiles/compare', compareGitHubProfiles);

// GET  /api/profiles/:username  →  Get one profile with full insights
router.get('/profiles/:username', getProfile);

// DELETE /api/profiles/:username →  Remove a profile from DB
router.delete('/profiles/:username', removeProfile);

// ─── Extras ──────────────────────────────────────────────────────────────────
// GET /api/stats        →  Overall analytics (top users, languages, etc.)
router.get('/stats', getOverallStats);

// GET /api/rate-limit   →  Check remaining GitHub API calls
router.get('/rate-limit', checkRateLimit);

module.exports = router;
