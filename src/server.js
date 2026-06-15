require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./database/db');

const PORT = process.env.PORT || 3000;

// Test DB connection before starting server
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     GitHub Profile Analyzer API Started      ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  🚀 Server running on port ${PORT}               ║`);
    console.log(`║  📡 API Base: http://localhost:${PORT}/api        ║`);
    console.log(`║  🌿 Environment: ${process.env.NODE_ENV}              ║`);
    console.log('╚══════════════════════════════════════════════╝');
  });
}).catch((err) => {
  console.error('❌ Failed to connect to database:', err.message);
  console.error('Please ensure MySQL is running and credentials in .env are correct.');
  process.exit(1);
});
