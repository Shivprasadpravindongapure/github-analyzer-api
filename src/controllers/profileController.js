const { fetchUserProfile, fetchUserRepos, getRateLimit } = require('../services/githubService');
const {
  upsertProfile, getAllProfiles, getProfileByUsername,
  deleteProfile, getStats, compareProfiles
} = require('../models/profileModel');

/**
 * POST /api/analyze/:username
 * Fetch GitHub data and store in DB
 */
const analyzeProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Fetch from GitHub API
    const [profileData, repos] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username)
    ]);

    // Save to database
    const profileId = await upsertProfile(profileData, repos);

    // Get the saved profile with insights to return
    const savedProfile = await getProfileByUsername(profileData.login);

    res.status(200).json({
      success: true,
      message: `Profile for '${username}' analyzed and stored successfully.`,
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

module.exports = {
  analyzeProfile, listProfiles, getProfile,
  removeProfile, getOverallStats, compareGitHubProfiles, checkRateLimit
};
