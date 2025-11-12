# Quick Start: Database Implementation

## 🚀 5-Minute Setup Guide

### Step 1: Create `.env` File

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fleetpulse
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NODE_ENV=development
```

**Replace:**
- `postgres` - Your PostgreSQL username
- `yourpassword` - Your PostgreSQL password
- `fleetpulse` - Your database name (change if different)

### Step 2: Run Database Schema

```bash
psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

**If you need to enter password:**
```bash
PGPASSWORD=yourpassword psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

**On Windows (PowerShell):**
```powershell
$env:PGPASSWORD="yourpassword"; psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

### Step 3: Test Database Connection

```bash
npm run test:db
```

You should see:
```
✅ Database connected successfully!
✅ PostGIS version: ...
📊 Found tables: devices, telemetry, alerts, geofences
✅ All required tables exist!
🎉 Database setup looks good!
```

### Step 4: Start the Application

```bash
npm run dev
```

When the app starts, check the console:
- ✅ If you see "Database connected" - **Success!**
- ⚠️ If you see "Database not available, using in-memory fallback" - Check your `.env` file

### Step 5: Verify It's Working

1. Open `http://localhost:3000`
2. Click "Start Simulation"
3. Check the database:

```bash
psql -U postgres -d fleetpulse -c "SELECT COUNT(*) FROM telemetry;"
```

You should see telemetry records being created!

## 🐛 Troubleshooting

### "Database not available" message?

1. **Check PostgreSQL is running:**
   ```bash
   pg_isready
   # or
   psql -U postgres -c "SELECT version();"
   ```

2. **Verify your `.env` file:**
   - Make sure `DATABASE_URL` is correct
   - Check username, password, host, and database name

3. **Test connection manually:**
   ```bash
   psql -U postgres -d fleetpulse
   ```
   If this works, your connection string is correct.

### "relation does not exist" error?

Run the schema script again:
```bash
psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

### "PostGIS extension not found"?

1. Install PostGIS
2. Enable it:
   ```bash
   psql -U postgres -d fleetpulse -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

### Still having issues?

Run the test script for detailed diagnostics:
```bash
npm run test:db
```

## ✅ Success Checklist

- [ ] `.env` file created with correct `DATABASE_URL`
- [ ] Schema script executed successfully
- [ ] `npm run test:db` shows all green checkmarks
- [ ] App starts without "using in-memory fallback" warning
- [ ] Simulation creates data in database
- [ ] Can query devices, telemetry, and alerts from database

## 📊 Verify Data in Database

After running simulation, check:

```sql
-- Check devices
SELECT id, name, type, status FROM devices;

-- Check recent telemetry
SELECT device_id, timestamp, speed, temperature, fuel 
FROM telemetry 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check alerts
SELECT device_id, alert_type, severity, message, created_at 
FROM alerts 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎉 You're Done!

Your database is now fully integrated! The app will:
- ✅ Save all devices to database
- ✅ Store telemetry data
- ✅ Create alerts in database
- ✅ Persist data across restarts


