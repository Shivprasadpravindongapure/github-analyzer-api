const { fetchUserProfile, fetchUserRepos, getRateLimit } = require('../services/githubService');
const {
  upsertProfile, getAllProfiles, getProfileByUsername,
  deleteProfile, getStats, compareProfiles,
  getProfilesByTier, isProfileStale
} = require('../models/profileModel');


/**
 * POST /api/analyze/:username
 * Fetch GitHub data and store in DB
 */
const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const force = req.query.force === 'true';

    // Smart cache: skip GitHub API if analyzed within last 60 min (unless ?force=true)
    const stale = await isProfileStale(username);
    if (stale === false && !force) {
      const cachedProfile = await getProfileByUsername(username);
      return res.status(200).json({
        success: true,
        message: `Returning cached profile for '${username}'. Use ?force=true to force refresh.`,
        cached: true,
        data: cachedProfile
      });
    }

    // Fetch fresh data from GitHub API
    const [profileData, repos] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username)
    ]);

    await upsertProfile(profileData, repos);
    const savedProfile = await getProfileByUsername(profileData.login);

    res.status(200).json({
      success: true,
      message: `Profile for '${username}' analyzed and stored successfully.`,
      cached: false,
      data: savedProfile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles
 * Get all stored profiles (paginated)
 */
const listProfiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'analyzed_at', order = 'DESC' } = req.query;
    const result = await getAllProfiles({ page, limit, sort, order });

    res.status(200).json({
      success: true,
      message: `Found ${result.total} profile(s).`,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      },
      data: result.profiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles/:username
 * Get a single profile's full details
 */
const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const profile = await getProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' not found in database. Use POST /api/analyze/${username} to analyze it first.`
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/profiles/:username
 * Delete a profile from the database
 */
const removeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const deleted = await deleteProfile(username);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' not found in database.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Profile '${username}' and all related data deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats
 * Get overall analytics/statistics
 */
const getOverallStats = async (req, res, next) => {
  try {
    const stats = await getStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles/compare?users=user1,user2,user3
 * Compare multiple profiles side by side
 */
const compareGitHubProfiles = async (req, res, next) => {
  try {
    const { users } = req.query;
    if (!users) {
      return res.status(400).json({
        success: false,
        message: 'Please provide users query param. Example: ?users=torvalds,gaearon'
      });
    }

    const usernames = users.split(',').map(u => u.trim()).filter(Boolean);
    if (usernames.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 usernames to compare.'
      });
    }

    const profiles = await compareProfiles(usernames);
    const notFound = usernames.filter(u => !profiles.find(p => p.username === u));

    res.status(200).json({
      success: true,
      message: `Comparing ${profiles.length} profile(s).`,
      not_found_in_db: notFound.length > 0 ? notFound : undefined,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rate-limit
 * Check GitHub API rate limit status
 */
const checkRateLimit = async (req, res, next) => {
  try {
    const rateLimit = await getRateLimit();
    res.status(200).json({
      success: true,
      data: {
        limit: rateLimit.limit,
        used: rateLimit.used,
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.reset * 1000).toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/analyze/batch
 * Analyze multiple GitHub profiles in one request
 */
const batchAnalyze = async (req, res, next) => {
  try {
    const { usernames } = req.body;
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide a JSON body: { "usernames": ["user1", "user2", ...] }'
      });
    }
    if (usernames.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 usernames allowed per batch request.'
      });
    }

    const results = [];
    const errors  = [];

    for (const username of usernames) {
      try {
        const [profileData, repos] = await Promise.all([
          fetchUserProfile(username),
          fetchUserRepos(username)
        ]);
        await upsertProfile(profileData, repos);
        const saved = await getProfileByUsername(profileData.login);
        results.push({
          username,
          status: 'success',
          tier: saved.developer_badge,
          followers: saved.followers,
          total_stars_received: saved.total_stars_received
        });
      } catch (err) {
        errors.push({ username, status: 'failed', reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch complete: ${results.length} succeeded, ${errors.length} failed.`,
      analyzed: results,
      failed: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profiles/:username/refresh
 * Force re-fetch a profile from GitHub
 */
const refreshProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const existing = await getProfileByUsername(username);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' not found. Use POST /api/analyze/${username} first.`
      });
    }
    const [profileData, repos] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username)
    ]);
    await upsertProfile(profileData, repos);
    const refreshed = await getProfileByUsername(profileData.login);
    res.status(200).json({
      success: true,
      message: `Profile '${username}' refreshed from GitHub successfully.`,
      data: refreshed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profiles/tier/:tier
 * Get all profiles filtered by developer tier
 */
const getByTier = async (req, res, next) => {
  try {
    const { tier } = req.params;
    const profiles = await getProfilesByTier(tier);
    res.status(200).json({
      success: true,
      tier: tier.toUpperCase(),
      total: profiles.length,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeProfile, listProfiles, getProfile,
  removeProfile, getOverallStats, compareGitHubProfiles,
  checkRateLimit, batchAnalyze, refreshProfile, getByTier
};
