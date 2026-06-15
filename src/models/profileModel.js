const { query } = require('../database/db');

/**
 * Calculate developer tier and badge based on scores
 */
const calculateTier = (activityScore, influenceScore, followers, publicRepos) => {
  // Weighted combined score
  const combinedScore = (
    (parseFloat(activityScore) * 0.35) +
    (parseFloat(influenceScore) * 0.35) +
    (Math.min(100, followers / 100) * 0.20) +
    (Math.min(100, publicRepos * 2) * 0.10)
  );

  let tier, badge, emoji, description;

  if (combinedScore >= 95) {
    tier = 'LEGEND';       badge = '👑 Legend';       emoji = '👑';
    description = 'An iconic developer with massive global impact.';
  } else if (combinedScore >= 80) {
    tier = 'EXPERT';       badge = '🚀 Expert';       emoji = '🚀';
    description = 'Highly experienced developer with strong community presence.';
  } else if (combinedScore >= 60) {
    tier = 'ADVANCED';     badge = '💎 Advanced';     emoji = '💎';
    description = 'Skilled developer with notable open source contributions.';
  } else if (combinedScore >= 40) {
    tier = 'INTERMEDIATE'; badge = '🔥 Intermediate'; emoji = '🔥';
    description = 'Growing developer with solid GitHub activity.';
  } else if (combinedScore >= 20) {
    tier = 'RISING_STAR';  badge = '⚡ Rising Star';  emoji = '⚡';
    description = 'Up-and-coming developer showing promising progress.';
  } else {
    tier = 'BEGINNER';     badge = '🌱 Beginner';     emoji = '🌱';
    description = 'Early stage developer just getting started.';
  }

  return { tier, badge, emoji, description, combinedScore: parseFloat(combinedScore.toFixed(2)) };
};

/**
 * Calculate insights from repos data
 */
const calculateInsights = (repos, accountCreatedAt) => {
  const totalStars   = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks   = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const originalRepos = repos.filter(r => !r.fork);
  const forkedRepos   = repos.filter(r => r.fork);

  // Language frequency map
  const langMap = {};
  repos.forEach(r => {
    if (r.language) {
      langMap[r.language] = (langMap[r.language] || 0) + 1;
    }
  });

  const topLanguage = Object.keys(langMap).sort((a, b) => langMap[b] - langMap[a])[0] || null;
  const avgStars    = repos.length > 0 ? (totalStars / repos.length).toFixed(2) : 0;

  // Account age in days
  const createdDate   = new Date(accountCreatedAt);
  const now           = new Date();
  const accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

  // Activity score (0–100): based on repos, stars, followers contribution
  const activityScore = Math.min(
    100,
    (originalRepos.length * 2) + (totalStars * 0.5) + (totalForks * 0.3)
  ).toFixed(2);

  // Influence score (0–100): based on stars + forks
  const influenceScore = Math.min(
    100,
    (totalStars * 0.7) + (totalForks * 0.3)
  ).toFixed(2);

  return {
    topLanguage,
    languageDiversityCount: Object.keys(langMap).length,
    totalStarsReceived: totalStars,
    totalForksReceived: totalForks,
    originalReposCount: originalRepos.length,
    forkedReposCount: forkedRepos.length,
    avgStarsPerRepo: parseFloat(avgStars),
    accountAgeDays,
    activityScore: parseFloat(activityScore),
    influenceScore: parseFloat(influenceScore),
    languageMap: langMap,
    tier: calculateTier(activityScore, influenceScore, 0, originalRepos.length)
  };
};

/**
 * Save or update a GitHub profile in the database
 */
const upsertProfile = async (profileData, repos) => {
  const p = profileData;

  // Upsert profile
  const profileSql = `
    INSERT INTO github_profiles
      (username, name, bio, avatar_url, profile_url, company, blog, location,
       email, hireable, twitter_username, public_repos, public_gists,
       followers, following, account_created_at, account_updated_at, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), bio = VALUES(bio), avatar_url = VALUES(avatar_url),
      company = VALUES(company), blog = VALUES(blog), location = VALUES(location),
      email = VALUES(email), hireable = VALUES(hireable),
      twitter_username = VALUES(twitter_username),
      public_repos = VALUES(public_repos), public_gists = VALUES(public_gists),
      followers = VALUES(followers), following = VALUES(following),
      account_updated_at = VALUES(account_updated_at),
      analyzed_at = NOW()
  `;

  await query(profileSql, [
    p.login, p.name, p.bio, p.avatar_url, p.html_url,
    p.company, p.blog, p.location, p.email,
    p.hireable ? 1 : 0, p.twitter_username,
    p.public_repos, p.public_gists, p.followers, p.following,
    new Date(p.created_at), new Date(p.updated_at)
  ]);

  // Get the profile id
  const [profile] = await query('SELECT id FROM github_profiles WHERE username = ?', [p.login]);
  const profileId = profile.id;

  // Delete old repos then re-insert
  await query('DELETE FROM github_repositories WHERE profile_id = ?', [profileId]);
  for (const repo of repos) {
    await query(`
      INSERT INTO github_repositories
        (profile_id, repo_name, description, language, stars, forks, watchers,
         open_issues, is_fork, repo_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      profileId, repo.name, repo.description, repo.language,
      repo.stargazers_count, repo.forks_count, repo.watchers_count,
      repo.open_issues_count, repo.fork ? 1 : 0, repo.html_url,
      new Date(repo.created_at), new Date(repo.updated_at)
    ]);
  }

  // Calculate and upsert insights — pass real followers count for tier
  const insights = calculateInsights(repos, p.created_at);
  const tier = calculateTier(
    insights.activityScore, insights.influenceScore,
    p.followers, p.public_repos
  );

  await query(`
    INSERT INTO profile_insights
      (profile_id, top_language, language_diversity_count, total_stars_received,
       total_forks_received, original_repos_count, forked_repos_count,
       avg_stars_per_repo, account_age_days, activity_score, influence_score,
       combined_score, developer_tier, developer_badge, tier_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      top_language = VALUES(top_language),
      language_diversity_count = VALUES(language_diversity_count),
      total_stars_received = VALUES(total_stars_received),
      total_forks_received = VALUES(total_forks_received),
      original_repos_count = VALUES(original_repos_count),
      forked_repos_count = VALUES(forked_repos_count),
      avg_stars_per_repo = VALUES(avg_stars_per_repo),
      account_age_days = VALUES(account_age_days),
      activity_score = VALUES(activity_score),
      influence_score = VALUES(influence_score),
      combined_score = VALUES(combined_score),
      developer_tier = VALUES(developer_tier),
      developer_badge = VALUES(developer_badge),
      tier_description = VALUES(tier_description)
  `, [
    profileId, insights.topLanguage, insights.languageDiversityCount,
    insights.totalStarsReceived, insights.totalForksReceived,
    insights.originalReposCount, insights.forkedReposCount,
    insights.avgStarsPerRepo, insights.accountAgeDays,
    insights.activityScore, insights.influenceScore,
    tier.combinedScore, tier.tier, tier.badge, tier.description
  ]);

  // Upsert language breakdown
  await query('DELETE FROM profile_languages WHERE profile_id = ?', [profileId]);
  for (const [lang, count] of Object.entries(insights.languageMap)) {
    await query(`
      INSERT INTO profile_languages (profile_id, language, repo_count)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE repo_count = VALUES(repo_count)
    `, [profileId, lang, count]);
  }

  return profileId;
};

/**
 * Get all stored profiles with insights
 */
const getAllProfiles = async ({ page = 1, limit = 10, sort = 'analyzed_at', order = 'DESC' }) => {
  const validSorts = ['followers', 'public_repos', 'analyzed_at', 'username'];
  const validOrders = ['ASC', 'DESC'];
  const sortCol  = validSorts.includes(sort) ? sort : 'analyzed_at';
  const orderDir = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
  const offset   = (page - 1) * limit;

  const profiles = await query(`
    SELECT
      gp.id, gp.username, gp.name, gp.bio, gp.avatar_url, gp.profile_url,
      gp.location, gp.public_repos, gp.followers, gp.following,
      gp.analyzed_at,
      pi.top_language, pi.total_stars_received, pi.activity_score,
      pi.influence_score, pi.developer_tier, pi.developer_badge, pi.combined_score
    FROM github_profiles gp
    LEFT JOIN profile_insights pi ON gp.id = pi.profile_id
    ORDER BY gp.${sortCol} ${orderDir}
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)]);

  const [{ total }] = await query('SELECT COUNT(*) as total FROM github_profiles');

  return { profiles, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get a single profile with full details
 */
const getProfileByUsername = async (username) => {
  const [profile] = await query(`
    SELECT
      gp.*, pi.top_language, pi.language_diversity_count, pi.total_stars_received,
      pi.total_forks_received, pi.original_repos_count, pi.forked_repos_count,
      pi.avg_stars_per_repo, pi.account_age_days, pi.activity_score, pi.influence_score,
      pi.combined_score, pi.developer_tier, pi.developer_badge, pi.tier_description
    FROM github_profiles gp
    LEFT JOIN profile_insights pi ON gp.id = pi.profile_id
    WHERE gp.username = ?
  `, [username]);

  if (!profile) return null;

  // Top repos
  const topRepos = await query(`
    SELECT repo_name, description, language, stars, forks, repo_url
    FROM github_repositories
    WHERE profile_id = ?
    ORDER BY stars DESC
    LIMIT 5
  `, [profile.id]);

  // Language breakdown
  const languages = await query(`
    SELECT language, repo_count
    FROM profile_languages
    WHERE profile_id = ?
    ORDER BY repo_count DESC
  `, [profile.id]);

  return { ...profile, topRepos, languages };
};

/**
 * Delete a profile and all related data
 */
const deleteProfile = async (username) => {
  const [profile] = await query('SELECT id FROM github_profiles WHERE username = ?', [username]);
  if (!profile) return false;
  await query('DELETE FROM github_profiles WHERE id = ?', [profile.id]);
  return true;
};

/**
 * Get overall stats
 */
const getStats = async () => {
  const [counts] = await query(`
    SELECT
      COUNT(*) as total_profiles,
      SUM(followers) as total_followers,
      SUM(public_repos) as total_repos,
      AVG(followers) as avg_followers
    FROM github_profiles
  `);

  const topByStars = await query(`
    SELECT gp.username, gp.name, pi.total_stars_received, pi.activity_score
    FROM github_profiles gp
    JOIN profile_insights pi ON gp.id = pi.profile_id
    ORDER BY pi.total_stars_received DESC
    LIMIT 5
  `);

  const languages = await query(`
    SELECT language, SUM(repo_count) as count
    FROM profile_languages
    GROUP BY language
    ORDER BY count DESC
    LIMIT 10
  `);

  return { counts, topByStars, topLanguages: languages };
};

/**
 * Compare multiple profiles
 */
const compareProfiles = async (usernames) => {
  const placeholders = usernames.map(() => '?').join(',');
  const profiles = await query(`
    SELECT
      gp.username, gp.name, gp.public_repos, gp.followers, gp.following,
      pi.top_language, pi.total_stars_received, pi.activity_score,
      pi.influence_score, pi.account_age_days, pi.language_diversity_count,
      pi.developer_tier, pi.developer_badge, pi.combined_score
    FROM github_profiles gp
    LEFT JOIN profile_insights pi ON gp.id = pi.profile_id
    WHERE gp.username IN (${placeholders})
  `, usernames);
  return profiles;
};

/**
 * Get profiles filtered by developer tier
 */
const getProfilesByTier = async (tier) => {
  const validTiers = ['BEGINNER', 'RISING_STAR', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'LEGEND'];
  if (!validTiers.includes(tier.toUpperCase())) {
    throw new Error(`Invalid tier. Valid tiers: ${validTiers.join(', ')}`);
  }
  const profiles = await query(`
    SELECT
      gp.username, gp.name, gp.avatar_url, gp.profile_url,
      gp.public_repos, gp.followers,
      pi.developer_tier, pi.developer_badge, pi.combined_score,
      pi.top_language, pi.total_stars_received, pi.activity_score
    FROM github_profiles gp
    JOIN profile_insights pi ON gp.id = pi.profile_id
    WHERE pi.developer_tier = ?
    ORDER BY pi.combined_score DESC
  `, [tier.toUpperCase()]);
  return profiles;
};

/**
 * Check if a profile is stale (analyzed more than 1 hour ago)
 * Returns true if needs refresh, false if still fresh
 */
const isProfileStale = async (username, maxAgeMinutes = 60) => {
  const [profile] = await query(
    'SELECT analyzed_at FROM github_profiles WHERE username = ?',
    [username]
  );
  if (!profile) return null; // Not found at all
  const ageMs = Date.now() - new Date(profile.analyzed_at).getTime();
  const ageMinutes = ageMs / (1000 * 60);
  return ageMinutes > maxAgeMinutes;
};

module.exports = {
  upsertProfile, getAllProfiles, getProfileByUsername,
  deleteProfile, getStats, compareProfiles,
  getProfilesByTier, isProfileStale
};
