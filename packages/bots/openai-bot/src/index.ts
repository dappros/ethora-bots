import { BotManager } from './BotManager';
import { createApiServer } from './api/server';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenvConfig();

async function main() {
  const openAIApiKey = process.env.OPENAI_API_KEY;
  const configFile = process.env.BOT_CONFIG_FILE || path.join(__dirname, '../config/test-bots.json');
  const apiPort = parseInt(process.env.API_PORT || '3000');
  const apiHost = process.env.API_HOST || 'localhost';
  const apiSecretKey = process.env.API_SECRET_KEY;
  const enableApi = process.env.ENABLE_API === 'true';

  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Starting Multi-Tenant OpenAI Bot Manager...');
  console.log(`Loading configuration from: ${configFile}`);

  const botManager = new BotManager(openAIApiKey);

  try {
    // Load bot configurations from file
    await botManager.loadFromFile(configFile);

    // Display status
    const status = botManager.getStatus();
    console.log('\nBot Instances Status:');
    status.forEach(bot => {
      console.log(`- ${bot.id}: ${bot.active ? 'Active' : 'Inactive'} (Room: ${bot.config.chatroomJid})`);
    });

    // Start API server if enabled
    if (enableApi) {
      if (!apiSecretKey) {
        console.error('API_SECRET_KEY is required when API is enabled');
        process.exit(1);
      }

      const app = createApiServer(botManager, apiSecretKey);
      const server = app.listen(apiPort, apiHost, () => {
        console.log(`\nAPI server listening on http://${apiHost}:${apiPort}`);
        console.log('Use Authorization header: Bearer <API_SECRET_KEY>');
      });

      // Handle API server shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down API server...');
        server.close();
      });

      process.on('SIGTERM', async () => {
        console.log('\nShutting down API server...');
        server.close();
      });
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await botManager.stopAll();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await botManager.stopAll();
      process.exit(0);
    });

    // Keep the process running
    console.log('\nBot Manager is running. Press Ctrl+C to stop.');
    if (enableApi) {
      console.log('API endpoints available at /api/bots');
    }
  } catch (error) {
    console.error('Error starting bot manager:', error);
    await botManager.stopAll();
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});