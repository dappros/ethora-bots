import { TestBot } from './bot';
import winston from 'winston';
import { config } from './config';
import { TestScenarios } from './test-scenarios';

// Configure logger with custom format
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += `\n${JSON.stringify(metadata, null, 2)}`;
      }
      return msg;
    })
  ),
  transports: [
    // Console output with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Detailed log file
    new winston.transports.File({ 
      filename: 'logs/test-bot.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Separate error log
    new winston.transports.File({ 
      filename: 'logs/error.log',
      level: 'error'
    })
  ]
});

// Initialize test scenarios
const testScenarios = new TestScenarios(config, logger);

// Start test execution
async function runTests() {
  try {
    logger.info('Starting test scenarios...', { config: {
      apiUrl: config.apiUrl,
      botName: config.botName,
      createNewRoom: config.createNewRoom
    }});

    // Step 1: Create bot user
    await testScenarios.createBotUser();
    if (!testScenarios.getBotUser()) {
      throw new Error('Failed to create bot user');
    }

    const botUser = testScenarios.getBotUser()!;

    // Step 2: Initialize bot with created user credentials
    const bot = new TestBot({
      jid: `${botUser.id}@dev.xmpp.ethoradev.com`,
      password: botUser.password,
      botName: config.botName,
      roomJid: config.roomJid || '',
      xmppEndpoint: 'wss://dev.xmpp.ethoradev.com:5443/ws'
    }, logger);

    // Step 3: Connect to XMPP
    await bot.start();
    logger.info('Bot connected successfully');

    // Step 4: Run remaining test scenarios
    await testScenarios.runTests();
    
    logger.info('Test scenarios completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Test scenarios failed', { error });
    process.exit(1);
  }
}

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Start the tests
runTests().catch((error) => {
  logger.error('Tests failed', { error });
  process.exit(1);
});
