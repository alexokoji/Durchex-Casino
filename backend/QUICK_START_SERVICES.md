# Quick Start - Backend Services

## Start All Services with One Command

### Linux/Mac
```bash
cd backend
./start-backend.sh
```

### Windows
```bash
cd backend
start-backend.bat
```

### Or Simply
```bash
cd backend
npm start
# or
node server.js
```

## What Happens

When you run any of these commands, the backend server automatically starts these 11 services:

✓ **Game Services:**
- Crash Game Service
- Dice Game Service
- Mines Game Service
- Plinko Game Service
- Scissors Game Service
- Slot Game Service
- TurtleRace Game Service

✓ **Management Services:**
- Management Service
- UserChat Service
- Admin Service

✓ **Background Jobs:**
- Tournament Cron Job

## Verify All Services Started

You should see output like:
```
[✓] Crash Service started successfully
[✓] Dice Service started successfully
[✓] Mines Service started successfully
... (more services)
[✓] TournamentCron Job started successfully

Started: 11/11
```

## Logs

Check `/backend/logs` for detailed service logs.

## Troubleshooting

**Services won't start?**
1. Ensure MongoDB is running
2. Run `npm install` in the backend directory
3. Check that all ports are available
4. Verify `.env` file is configured

**Still having issues?** 
See `SERVICES_INITIALIZATION.md` for detailed troubleshooting.
