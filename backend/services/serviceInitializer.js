/**
 * Service Initializer
 * Initializes and starts all microservices
 */

const path = require('path');

const services = [
    {
        name: 'Crash',
        servicePath: '../crash/CrashService.js',
        configPath: '../crash/config.js'
    },
    {
        name: 'Dice',
        servicePath: '../dice/DiceService.js',
        configPath: '../dice/config.js'
    },
    {
        name: 'Mines',
        servicePath: '../mines/MinesService.js',
        configPath: '../mines/config.js'
    },
    {
        name: 'Plinko',
        servicePath: '../plinko/PlinkoService.js',
        configPath: '../plinko/config.js'
    },
    {
        name: 'Scissors',
        servicePath: '../scissors/ScissorsService.js',
        configPath: '../scissors/config.js'
    },
    {
        name: 'Slot',
        servicePath: '../slot/SlotService.js',
        configPath: '../slot/config.js'
    },
    {
        name: 'TurtleRace',
        servicePath: '../turtlerace/TurtleService.js',
        configPath: '../turtlerace/config.js'
    },
    {
        name: 'Management',
        servicePath: '../management/ManagementService.js',
        configPath: '../management/config.js'
    },
    {
        name: 'UserChat',
        servicePath: '../userchat/UserChatService.js',
        configPath: '../userchat/config.js'
    },
    {
        name: 'Admin',
        servicePath: '../admin/AdminService.js',
        configPath: '../admin/config.js'
    }
];

/**
 * Initialize all services
 */
const initializeServices = async () => {
    console.log('\n========================================');
    console.log('Starting Backend Microservices');
    console.log('========================================\n');

    const startedServices = [];
    const failedServices = [];

    for (const service of services) {
        try {
            console.log(`[*] Initializing ${service.name} Service...`);
            
            // Dynamically require and start the service
            require(service.servicePath);
            
            startedServices.push(service.name);
            console.log(`[✓] ${service.name} Service started successfully\n`);
        } catch (error) {
            console.error(`[✗] Failed to start ${service.name} Service:`, error.message);
            failedServices.push({ name: service.name, error: error.message });
            console.log();
        }
    }

    // Initialize tournament cron job
    try {
        console.log(`[*] Initializing Tournament Cron Job...`);
        const tournamentCron = require('../tournamentCron/index');
        tournamentCron.tournamentProc();
        startedServices.push('TournamentCron');
        console.log(`[✓] Tournament Cron Job started successfully\n`);
    } catch (error) {
        console.error(`[✗] Failed to start Tournament Cron Job:`, error.message);
        failedServices.push({ name: 'TournamentCron', error: error.message });
        console.log();
    }

    console.log('========================================');
    console.log('Service Startup Summary');
    console.log('========================================');
    console.log(`Started: ${startedServices.length}/${services.length + 1}`);
    
    if (startedServices.length > 0) {
        console.log('✓ Running Services:');
        startedServices.forEach(s => console.log(`  - ${s}`));
    }
    
    if (failedServices.length > 0) {
        console.log('\n✗ Failed Services:');
        failedServices.forEach(s => console.log(`  - ${s.name}: ${s.error}`));
    }
    
    console.log('========================================\n');

    return {
        total: services.length + 1,
        started: startedServices.length,
        failed: failedServices.length,
        details: {
            started: startedServices,
            failed: failedServices
        }
    };
};

module.exports = {
    initializeServices,
    services
};
