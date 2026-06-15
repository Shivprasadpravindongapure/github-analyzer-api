require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const statements = [
    'ALTER TABLE profile_insights ADD COLUMN IF NOT EXISTS combined_score DECIMAL(5,2) DEFAULT 0',
    'ALTER TABLE profile_insights ADD COLUMN IF NOT EXISTS developer_tier VARCHAR(50) DEFAULT "BEGINNER"',
    'ALTER TABLE profile_insights ADD COLUMN IF NOT EXISTS developer_badge VARCHAR(100)',
    'ALTER TABLE profile_insights ADD COLUMN IF NOT EXISTS tier_description TEXT'
  ];

  for (const sql of statements) {
    try {
      await conn.query(sql);
      console.log('✅ OK:', sql.substring(0, 65));
    } catch (e) {
      console.log('⚠️  SKIP (already exists?):', e.message.substring(0, 65));
    }
  }

  await conn.end();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
