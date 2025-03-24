import { config } from './config';
import { TestScenarios } from './test-scenarios';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/setup-openai-bot.log' })
  ]
});

async function main() {
  try {
    logger.info('Starting OpenAI bot setup...');
    
    const testScenarios = new TestScenarios(config, logger);
    
    // Create OpenAI bot user
    const botUser = await testScenarios.createOpenAIBotUser();
    logger.info('OpenAI bot user created', {
      id: botUser.id,
      walletAddress: botUser.walletAddress
    });

    // Get available rooms
    const rooms = await testScenarios.listRooms();
    if (rooms.length === 0) {
      throw new Error('No rooms available to join');
    }
    
    const firstRoom = rooms[0];
    logger.info('Found room to join', {
      name: firstRoom.name,
      jid: firstRoom.jid
    });

    // Update OpenAI bot .env file
    const envPath = path.join(__dirname, '../../openai-bot/.env');
    const envContent = `# Bot XMPP credentials
BOT_JID=${botUser.id}@${config.xmppDomain}
BOT_PASSWORD=${botUser.password}
BOT_NAME=OpenAI Assistant

# Chat Room JID
ROOM_JID=${firstRoom.jid}

# XMPP chat server endpoint
XMPP_ENDPOINT=${config.xmppWebsocketUrl}

# OpenAI API key - you'll need to provide this
OPENAI_API_KEY=`;

    fs.writeFileSync(envPath, envContent);
    logger.info('Updated OpenAI bot .env file', { path: envPath });

    logger.info('OpenAI bot setup completed successfully');
    logger.info('Please add your OpenAI API key to the .env file and run the bot');
  } catch (error) {
    logger.error('Failed to set up OpenAI bot', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    process.exit(1);
  }
}

main(); 