/**
 * Example script demonstrating how to use the OpenAI Bot API
 * 
 * This shows how the Ethora backend can interact with the bot manager
 * to dynamically create and manage bot instances.
 */

const API_URL = 'http://localhost:3000';
const API_KEY = 'your_secret_key_here'; // Same as API_SECRET_KEY in .env

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  return response.json();
}

// Example: Create a new bot instance
async function createBot() {
  const botConfig = {
    xmppUsername: 'support-bot@conference.main.dappros.com',
    xmppPassword: 'secure_password_123',
    firstName: 'Support',
    lastName: 'Bot',
    chatroomJid: 'support-room@conference.main.dappros.com',
    systemPrompt: 'You are a technical support assistant. Help users troubleshoot issues and provide clear solutions.'
  };

  console.log('Creating new bot instance...');
  const result = await apiRequest('POST', '/api/bots', botConfig);
  console.log('Bot created:', result);
  return result.id;
}

// Example: Get all bot instances
async function getAllBots() {
  console.log('\nFetching all bot instances...');
  const bots = await apiRequest('GET', '/api/bots');
  console.log('Active bots:', bots);
  return bots;
}

// Example: Get specific bot instance
async function getBot(id) {
  console.log(`\nFetching bot instance ${id}...`);
  const bot = await apiRequest('GET', `/api/bots/${id}`);
  console.log('Bot details:', bot);
  return bot;
}

// Example: Update a bot instance
async function updateBot(id) {
  const updatedConfig = {
    xmppUsername: 'support-bot@conference.main.dappros.com',
    xmppPassword: 'new_secure_password_456',
    firstName: 'Support',
    lastName: 'Assistant',
    chatroomJid: 'support-room@conference.main.dappros.com',
    systemPrompt: 'You are an enhanced technical support assistant with advanced troubleshooting capabilities.'
  };

  console.log(`\nUpdating bot instance ${id}...`);
  const result = await apiRequest('PUT', `/api/bots/${id}`, updatedConfig);
  console.log('Bot updated:', result);
  return result;
}

// Example: Remove a bot instance
async function removeBot(id) {
  console.log(`\nRemoving bot instance ${id}...`);
  const result = await apiRequest('DELETE', `/api/bots/${id}`);
  console.log('Bot removed:', result);
  return result;
}

// Example workflow
async function runExample() {
  try {
    // 1. Create a new bot
    const botId = await createBot();

    // 2. Get all bots
    await getAllBots();

    // 3. Get specific bot details
    await getBot(botId);

    // 4. Update the bot
    await updateBot(botId);

    // 5. Remove the bot
    await removeBot(botId);

    // 6. Verify removal
    await getAllBots();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  console.log('OpenAI Bot API Usage Example');
  console.log('===========================\n');
  console.log('Make sure the bot manager is running with ENABLE_API=true\n');
  
  runExample();
}