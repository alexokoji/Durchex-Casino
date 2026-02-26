# Backend Services Initialization Guide

## Overview

When the backend server starts, it automatically initializes and runs all necessary microservices. This ensures a single entry point for managing the entire backend application.

## Services Started

The following services are automatically initialized when the main backend server starts:

### Game Services (Microservices)
1. **Crash Game** - Crash/Multipler game service
2. **Dice Game** - Dice rolling game service  
3. **Mines Game** - Mines sweeper game service
4. **Plinko Game** - Plinko game service
5. **Scissors Game** - Scissors/RPS game service
6. **Slot Game** - Slot machine game service
7. **TurtleRace Game** - Turtle racing game service

### Management Services
1. **Management Service** - Overall platform management
2. **UserChat Service** - User chat/communication service
3. **Admin Service** - Admin panel and controls

### Background Jobs
1. **Tournament Cron Job** - Automated tournament scheduling and management

## Architecture

```
Main Backend Server (server.js)
    ↓
Service Initializer (services/serviceInitializer.js)
    ├── Crash Service (crash/CrashService.js)
    ├── Dice Service (dice/DiceService.js)
    ├── Mines Service (mines/MinesService.js)
    ├── Plinko Service (plinko/PlinkoService.js)
    ├── Scissors Service (scissors/ScissorsService.js)
    ├── Slot Service (slot/SlotService.js)
    ├── TurtleRace Service (turtlerace/TurtleService.js)
    ├── Management Service (management/ManagementService.js)
    ├── UserChat Service (userchat/UserChatService.js)
    ├── Admin Service (admin/AdminService.js)
    └── Tournament Cron Job (tournamentCron/index.js)
```

## Starting the Backend

### Single Command Startup
```bash
npm start
```

or

```bash
node server.js
```

This will:
1. Connect to MongoDB
2. Initialize Tatum blockchain services
3. Start all microservices (game services, management, admin, chat)
4. Initialize tournament cron job
5. Start the main API server
6. Display a comprehensive startup summary

### Startup Output Example
```
========================================
Starting Backend Microservices
========================================

[*] Initializing Crash Service...
[✓] Crash Service started successfully

[*] Initializing Dice Service...
[✓] Dice Service started successfully

... (more services)

[*] Initializing Tournament Cron Job...
[✓] Tournament Cron Job started successfully

========================================
Service Startup Summary
========================================
Started: 11/11
✓ Running Services:
  - Crash
  - Dice
  - Mines
  - Plinko
  - Scissors
  - Slot
  - TurtleRace
  - Management
  - UserChat
  - Admin
  - TournamentCron
========================================
```

## Service Configuration

Each service has its own configuration file:
- `crash/config.js` - Crash game configuration
- `dice/config.js` - Dice game configuration
- `mines/config.js` - Mines game configuration
- `plinko/config.js` - Plinko game configuration
- `scissors/config.js` - Scissors game configuration
- `slot/config.js` - Slot game configuration
- `turtlerace/config.js` - Turtle race configuration
- `management/config.js` - Management service configuration
- `userchat/config.js` - User chat service configuration
- `admin/config.js` - Admin service configuration

## Ports

Each service runs on a configured port defined in its respective `config.js`:
- Crash: `config.serverInfo.port`
- Dice: `config.serverInfo.port`
- Mines: `config.serverInfo.port`
- Plinko: `config.serverInfo.port`
- Scissors: `config.serverInfo.port`
- Slot: `config.serverInfo.port`
- TurtleRace: `config.serverInfo.port`
- Management: `config.serverInfo.port`
- UserChat: `config.serverInfo.port`
- Admin: `config.serverInfo.port`

## Troubleshooting

### Service Fails to Start
If a service fails to start, check:
1. MongoDB connection - ensure MongoDB is running
2. Service configuration - verify `config.js` has correct settings
3. Port availability - ensure configured port is not in use
4. Dependencies - run `npm install` in the backend directory

### Check Logs
Each service outputs initialization messages. Check the console output during startup or look in the `/logs` directory for detailed logs.

### Manual Service Start
To start a service individually (for debugging):
```bash
cd backend/crash
node CrashService.js
```

## Integration with Main Server

The main server includes these initialization steps:

1. **Express Setup** - Configure Express middleware and CORS
2. **Database Connection** - Connect to MongoDB
3. **Blockchain Services** - Initialize Tatum services
4. **Service Initialization** - Start all microservices
5. **Main Server** - Start main API server

See `backend/server.js` for implementation details.

## Adding New Services

To add a new service:

1. Create a new service folder with:
   - `ServiceName.js` - Main service file (with server.listen())
   - `app.js` - Express app factory with `exports.createApp(config)`
   - `config.js` - Service configuration
   - `manager/SocketManager.js` - Socket management

2. Add entry to `backend/services/serviceInitializer.js`:
```javascript
{
    name: 'YourService',
    servicePath: '../yourservice/YourService.js',
    configPath: '../yourservice/config.js'
}
```

3. Restart the main backend server - the new service will be initialized automatically

## Environment Variables

Ensure `.env` file is configured with:
```
DB_URL=your_mongodb_url
SERVER_PORT=your_main_server_port
NODE_ENV=development
```

Each service may also have its own environment-specific settings in its `config.js`.
