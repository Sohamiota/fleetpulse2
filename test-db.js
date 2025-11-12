const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Simple .env parser (Next.js loads .env automatically, but this script runs standalone)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔍 Testing database connection...');
    console.log('📝 Database URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Server time:', result.rows[0].now);
    
    // Test PostGIS
    try {
      const postgis = await pool.query('SELECT PostGIS_version()');
      console.log('✅ PostGIS version:', postgis.rows[0].postgis_version);
    } catch (e) {
      console.warn('⚠️  PostGIS extension not found. Install PostGIS to use geospatial features.');
    }
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tableNames = tables.rows.map(r => r.table_name);
    console.log('\n📊 Found tables:', tableNames.length);
    tableNames.forEach(name => console.log('   -', name));
    
    // Check if required tables exist
    const requiredTables = ['devices', 'telemetry', 'alerts'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.warn('\n⚠️  Missing required tables:', missingTables.join(', '));
      console.warn('   Run: psql -U postgres -d fleetpulse -f scripts/create-tables.sql');
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
    // Test table structure
    if (tableNames.includes('devices')) {
      const deviceCount = await pool.query('SELECT COUNT(*) FROM devices');
      console.log(`📦 Devices in database: ${deviceCount.rows[0].count}`);
    }
    
    await pool.end();
    console.log('\n🎉 Database setup looks good!');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check PostgreSQL is running');
    console.error('   2. Verify DATABASE_URL in .env file');
    console.error('   3. Check username, password, host, and database name');
    process.exit(1);
  }
}

testConnection();

