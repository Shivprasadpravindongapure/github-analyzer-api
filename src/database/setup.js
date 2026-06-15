require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'github_analyzer';

const schema = `
-- Create database
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
USE \`${DB_NAME}\`;

-- Main profiles table
CREATE TABLE IF NOT EXISTS github_profiles (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  username              VARCHAR(100) NOT NULL UNIQUE,
  name                  VARCHAR(200),
  bio                   TEXT,
  avatar_url            VARCHAR(500),
  profile_url           VARCHAR(500),
  company               VARCHAR(200),
  blog                  VARCHAR(500),
  location              VARCHAR(200),
  email                 VARCHAR(200),
  hireable              BOOLEAN DEFAULT FALSE,
  twitter_username      VARCHAR(100),
  public_repos          INT DEFAULT 0,
  public_gists          INT DEFAULT 0,
  followers             INT DEFAULT 0,
  following             INT DEFAULT 0,
  account_created_at    DATETIME,
  account_updated_at    DATETIME,
  analyzed_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_refreshed_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_followers (followers),
  INDEX idx_public_repos (public_repos)
);

-- Repositories table
CREATE TABLE IF NOT EXISTS github_repositories (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  profile_id        INT NOT NULL,
  repo_name         VARCHAR(200),
  description       TEXT,
  language          VARCHAR(100),
  stars             INT DEFAULT 0,
  forks             INT DEFAULT 0,
  watchers          INT DEFAULT 0,
  open_issues       INT DEFAULT 0,
  is_fork           BOOLEAN DEFAULT FALSE,
  repo_url          VARCHAR(500),
  created_at        DATETIME,
  updated_at        DATETIME,
  FOREIGN KEY (profile_id) REFERENCES github_profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_language (language),
  INDEX idx_stars (stars)
);

-- Insights / analytics table
CREATE TABLE IF NOT EXISTS profile_insights (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  profile_id                INT NOT NULL UNIQUE,
  top_language              VARCHAR(100),
  language_diversity_count  INT DEFAULT 0,
  total_stars_received      INT DEFAULT 0,
  total_forks_received      INT DEFAULT 0,
  original_repos_count      INT DEFAULT 0,
  forked_repos_count        INT DEFAULT 0,
  avg_stars_per_repo        DECIMAL(10,2) DEFAULT 0,
  account_age_days          INT DEFAULT 0,
  activity_score            DECIMAL(5,2) DEFAULT 0,
  influence_score           DECIMAL(5,2) DEFAULT 0,
  combined_score            DECIMAL(5,2) DEFAULT 0,
  developer_tier            VARCHAR(50) DEFAULT 'BEGINNER',
  developer_badge           VARCHAR(100),
  tier_description          TEXT,
  FOREIGN KEY (profile_id) REFERENCES github_profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_tier (developer_tier)
);

-- Language breakdown table
CREATE TABLE IF NOT EXISTS profile_languages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  profile_id   INT NOT NULL,
  language     VARCHAR(100) NOT NULL,
  repo_count   INT DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES github_profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_profile_lang (profile_id, language)
);
`;

async function setupDatabase() {
  let connection;
  try {
    // Connect without specifying DB first (to create it if needed)
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST || 'localhost',
      port:     process.env.DB_PORT || 3306,
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('🔌 Connected to MySQL server...');
    await connection.query(schema);
    console.log('✅ Database and tables created successfully!');
    console.log(`📦 Database: ${DB_NAME}`);
    console.log('📋 Tables created:');
    console.log('   - github_profiles');
    console.log('   - github_repositories');
    console.log('   - profile_insights');
    console.log('   - profile_languages');
    console.log('\n🚀 Setup complete! Run: npm run dev');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
