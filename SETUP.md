# FleetPulse Setup Guide

## Quick Start (Without Database)

The application can run in **fallback mode** without a database for demo purposes:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the application**

   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:3000`

4. **Start simulation**
   Click the "Start Simulation" button in the dashboard

That's it! The app will work with in-memory storage.

## Full Setup (With Database)

For production use with PostgreSQL:

### 1. Install PostgreSQL

**Windows:**

- Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install and set a password for the `postgres` user

**macOS:**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**

```bash
sudo apt-get install postgresql-14 postgresql-contrib
sudo systemctl start postgresql
```

### 2. Install PostGIS Extension

**Windows:**

- Use Stack Builder or download from [postgis.net](https://postgis.net/install/)

**macOS:**

```bash
brew install postgis
```

**Linux:**

```bash
sudo apt-get install postgresql-14-postgis-3
```

### 3. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fleetpulse;

# Connect to new database
\c fleetpulse

# Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# Exit
\q
```

### 4. Run Schema Script

```bash
psql -U postgres -d fleetpulse -f scripts/create-tables.sql
```

### 5. Configure Environment

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fleetpulse
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NODE_ENV=development
```

### 6. (Optional) Seed Sample Data

```bash
psql -U postgres -d fleetpulse -f scripts/seed-data.sql
```

### 7. Start Application

```bash
npm run dev
```

## Troubleshooting

### Database Connection Issues

**Error: "Database not available, using in-memory fallback"**

- Check PostgreSQL is running: `pg_isready`
- Verify connection string in `.env`
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-*.log`

**Error: "relation does not exist"**

- Run the schema script: `psql -U postgres -d fleetpulse -f scripts/create-tables.sql`

**Error: "PostGIS extension not found"**

- Install PostGIS extension
- Enable it: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Socket.IO Issues

**WebSocket not connecting**

- Ensure you're using `npm run dev` (not `npm run dev:next`)
- Check that port 3000 is not in use
- Verify `NEXT_PUBLIC_SOCKET_URL` in `.env`

### Port Already in Use

Change the port:

```bash
PORT=3001 npm run dev
```

Update `.env`:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Verification

### Test Database Connection

```bash
psql -U postgres -d fleetpulse -c "SELECT NOW();"
```

### Test PostGIS

```bash
psql -U postgres -d fleetpulse -c "SELECT PostGIS_version();"
```

### Test Application

1. Start the app: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Click "Start Simulation"
4. Check console for any errors
5. Verify devices appear on the map

## Development Mode

For development with hot reload:

```bash
npm run dev
```

This uses the custom server with Socket.IO support.

For standard Next.js dev mode (without Socket.IO):

```bash
npm run dev:next
```

## Production Mode

1. Build the application:

   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm run start
   ```

## Next Steps

1. **Customize Alert Thresholds**: Edit `app/api/telemetry/route.ts`
2. **Add More Devices**: Use the device simulator or POST to `/api/devices`
3. **Configure Simulation**: Edit `lib/simulation-engine.ts`
4. **Add Authentication**: See `README.md` for future enhancements

## Support

For issues:

- Check the README.md
- Review the troubleshooting section
- Open an issue on GitHub
