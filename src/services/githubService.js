const axios = require('axios');

const githubAPI = axios.create({
  baseURL: process.env.GITHUB_API_URL || 'https://api.github.com',
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Analyzer'
  },
  timeout: 10000
});

/**
 * Fetch a user's public GitHub profile
 */
const fetchUserProfile = async (username) => {
  try {
    const { data } = await githubAPI.get(`/users/${username}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found.`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch GitHub profile: ${error.message}`);
  }
};

/**
 * Fetch all public repositories for a user (up to 100)
 */
const fetchUserRepos = async (username) => {
  try {
    const { data } = await githubAPI.get(`/users/${username}/repos`, {
      params: { per_page: 100, sort: 'updated', type: 'public' }
    });
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found.`);
    }
    throw new Error(`Failed to fetch repositories: ${error.message}`);
  }
};

/**
 * Check current GitHub API rate limit status
 */
const getRateLimit = async () => {
  const { data } = await githubAPI.get('/rate_limit');
  return data.rate;
};

module.exports = { fetchUserProfile, fetchUserRepos, getRateLimit };
