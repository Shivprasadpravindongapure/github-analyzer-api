-- ============================================================
--  GitHub Profile Analyzer — Database Schema Export
--  Database: github_analyzer
--  Version: 2.0 (with Developer Tier System)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `github_analyzer`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `github_analyzer`;

-- ------------------------------------------------------------
-- Table: github_profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `github_profiles` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `username`            VARCHAR(100) NOT NULL UNIQUE,
  `name`                VARCHAR(200),
  `bio`                 TEXT,
  `avatar_url`          VARCHAR(500),
  `profile_url`         VARCHAR(500),
  `company`             VARCHAR(200),
  `blog`                VARCHAR(500),
  `location`            VARCHAR(200),
  `email`               VARCHAR(200),
  `hireable`            BOOLEAN DEFAULT FALSE,
  `twitter_username`    VARCHAR(100),
  `public_repos`        INT DEFAULT 0,
  `public_gists`        INT DEFAULT 0,
  `followers`           INT DEFAULT 0,
  `following`           INT DEFAULT 0,
  `account_created_at`  DATETIME,
  `account_updated_at`  DATETIME,
  `analyzed_at`         DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_refreshed_at`   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username`    (`username`),
  INDEX `idx_followers`   (`followers`),
  INDEX `idx_public_repos`(`public_repos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: github_repositories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `github_repositories` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `profile_id`  INT NOT NULL,
  `repo_name`   VARCHAR(200),
  `description` TEXT,
  `language`    VARCHAR(100),
  `stars`       INT DEFAULT 0,
  `forks`       INT DEFAULT 0,
  `watchers`    INT DEFAULT 0,
  `open_issues` INT DEFAULT 0,
  `is_fork`     BOOLEAN DEFAULT FALSE,
  `repo_url`    VARCHAR(500),
  `created_at`  DATETIME,
  `updated_at`  DATETIME,
  FOREIGN KEY (`profile_id`) REFERENCES `github_profiles`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile_id` (`profile_id`),
  INDEX `idx_language`   (`language`),
  INDEX `idx_stars`      (`stars`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: profile_insights (includes Developer Tier System)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profile_insights` (
  `id`                        INT AUTO_INCREMENT PRIMARY KEY,
  `profile_id`                INT NOT NULL UNIQUE,
  `top_language`              VARCHAR(100),
  `language_diversity_count`  INT DEFAULT 0,
  `total_stars_received`      INT DEFAULT 0,
  `total_forks_received`      INT DEFAULT 0,
  `original_repos_count`      INT DEFAULT 0,
  `forked_repos_count`        INT DEFAULT 0,
  `avg_stars_per_repo`        DECIMAL(10,2) DEFAULT 0,
  `account_age_days`          INT DEFAULT 0,
  `activity_score`            DECIMAL(5,2) DEFAULT 0,
  `influence_score`           DECIMAL(5,2) DEFAULT 0,
  -- Developer Tier System (Extra Feature)
  `combined_score`            DECIMAL(5,2) DEFAULT 0,
  `developer_tier`            VARCHAR(50) DEFAULT 'BEGINNER',
  `developer_badge`           VARCHAR(100),
  `tier_description`          TEXT,
  FOREIGN KEY (`profile_id`) REFERENCES `github_profiles`(`id`) ON DELETE CASCADE,
  INDEX `idx_profile_id` (`profile_id`),
  INDEX `idx_tier`       (`developer_tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: profile_languages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profile_languages` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `profile_id` INT NOT NULL,
  `language`   VARCHAR(100) NOT NULL,
  `repo_count` INT DEFAULT 0,
  FOREIGN KEY (`profile_id`) REFERENCES `github_profiles`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_profile_lang` (`profile_id`, `language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Developer Tier System — Tier levels & criteria
-- ============================================================
-- BEGINNER    : combined_score  0 - 19  (🌱)
-- RISING_STAR : combined_score 20 - 39  (⚡)
-- INTERMEDIATE: combined_score 40 - 59  (🔥)
-- ADVANCED    : combined_score 60 - 79  (💎)
-- EXPERT      : combined_score 80 - 94  (🚀)
-- LEGEND      : combined_score 95 - 100 (👑)
--
-- combined_score = (activity_score * 0.35) + (influence_score * 0.35)
--                + (min(100, followers/100) * 0.20)
--                + (min(100, public_repos*2) * 0.10)
-- ============================================================
