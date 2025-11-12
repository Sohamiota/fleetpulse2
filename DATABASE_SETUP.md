# Database Implementation Guide

## Step 1: Create Environment File

Create a `.env` file in the root directory with your database connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/fleetpulse
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NODE_ENV=development
```

**Replace:**
- `username` - Your PostgreSQL username (usually `postgres`)
- `password` - Your PostgreSQL password
- `localhost:5432` - Your database host and port (default is localhost:5432)
- `fleetpulse` - Your database name

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/fleetpulse
```

## Step 2: Run the Database Schema

Execute the SQL script to create all tables:

### Option A: Using psql command line

```bash
psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

Or if you need to specify password:
```bash
PGPASSWORD=yourpassword psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

### Option B: Using pgAdmin or DBeaver

1. Connect to your database
2. Open `scripts/create-tables.sql`
3. Execute the entire script

### Option C: Using psql interactively

```bash
psql -U postgres -d fleetpulse
```

Then paste and run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
-- (paste the rest of create-tables.sql content)
```

## Step 3: Verify Database Setup

Test that the tables were created:

```bash
psql -U postgres -d fleetpulse -c "\dt"
```

You should see:
- `devices`
- `telemetry`
- `alerts`
- `geofences`

Verify PostGIS extension:
```bash
psql -U postgres -d fleetpulse -c "SELECT PostGIS_version();"
```

## Step 4: Test Database Connection from App

Create a test script to verify the connection:

```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => {
  console.log('✅ Database connected!', res.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
"
```

## Step 5: Start the Application

```bash
npm run dev
```

Check the console output. You should see:
- ✅ "Database connected" (if successful)
- ⚠️ "Database not available, using in-memory fallback" (if connection failed)

## Step 6: Verify Database is Being Used

1. Start the simulation
2. Check the database for data:

```sql
-- Check devices
SELECT * FROM devices;

-- Check telemetry
SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 10;

-- Check alerts
SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

### Connection Refused

**Error:** `connection refused` or `ECONNREFUSED`

**Solutions:**
- Check PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql`
- Verify port: Default is 5432
- Check firewall settings

### Authentication Failed

**Error:** `password authentication failed`

**Solutions:**
- Verify username and password in `.env`
- Check PostgreSQL authentication settings in `pg_hba.conf`
- Try connecting manually: `psql -U postgres -d fleetpulse`

### Database Does Not Exist

**Error:** `database "fleetpulse" does not exist`

**Solution:**
```bash
createdb -U postgres fleetpulse
```

### PostGIS Extension Error

**Error:** `extension "postgis" does not exist`

**Solution:**
Install PostGIS, then:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Permission Denied

**Error:** `permission denied` or `must be owner`

**Solution:**
Grant permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE fleetpulse TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
```

## Quick Connection Test Script

Save this as `test-db.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Database connected successfully!');
    console.log('Time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test PostGIS
    const postgis = await pool.query('SELECT PostGIS_version()');
    console.log('✅ PostGIS version:', postgis.rows[0].postgis_version);
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n📊 Tables:', tables.rows.map(r => r.table_name).join(', '));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run it:
```bash
node test-db.js
```


