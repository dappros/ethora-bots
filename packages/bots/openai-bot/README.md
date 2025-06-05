# Multi-Tenant OpenAI Bot for Ethora

A scalable multi-tenant OpenAI chatbot that can manage multiple XMPP connections for different Ethora applications simultaneously.

## Features

- **Multi-Tenant Architecture**: Single process managing multiple bot instances
- **Custom System Prompts**: Each bot instance can have its own personality/context
- **Conversation Memory**: Maintains conversation history per user
- **Dynamic Management**: Add/remove bot instances at runtime (API coming soon)
- **Graceful Shutdown**: Properly disconnects all bot instances on exit

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
OPENAI_API_KEY=your_openai_api_key_here
BOT_CONFIG_FILE=./config/test-bots.json
```

### Bot Configuration File

Create a JSON configuration file (e.g., `config/test-bots.json`):

```json
[
  {
    "id": "bot-instance-1",
    "xmppUsername": "bot1@conference.main.dappros.com",
    "xmppPassword": "password123",
    "firstName": "AI",
    "lastName": "Assistant",
    "chatroomJid": "room1@conference.main.dappros.com",
    "systemPrompt": "You are a helpful AI assistant."
  },
  {
    "id": "bot-instance-2",
    "xmppUsername": "bot2@conference.main.dappros.com",
    "xmppPassword": "password456",
    "firstName": "Code",
    "lastName": "Helper",
    "chatroomJid": "room2@conference.main.dappros.com",
    "systemPrompt": "You are a programming assistant."
  }
]
```

### Configuration Parameters

- **id**: Unique identifier for the bot instance
- **xmppUsername**: Full XMPP JID for the bot user
- **xmppPassword**: XMPP password for authentication
- **firstName**: Bot's first name (used for mentions)
- **lastName**: Bot's last name
- **chatroomJid**: Full JID of the chatroom to join
- **systemPrompt**: Custom OpenAI system prompt defining bot behavior

## Usage

### Running in Development

```bash
npm run dev
```

### Running in Production

```bash
npm run build
npm start
```

### Bot Interaction

Users can interact with bots by mentioning them:
```
@AI How can you help me today?
```

Each bot will only respond to messages that mention its first name.

## Architecture

### Key Components

1. **BotManager**: Manages multiple bot instances
   - Loads configurations
   - Creates/removes instances
   - Handles lifecycle

2. **BotInstance**: Individual bot connection
   - Manages XMPP connection
   - Handles messages
   - Maintains conversation context

3. **OpenAIService**: OpenAI API integration
   - Generates responses
   - Manages system prompts

4. **MemoryService**: Conversation history
   - Stores user conversations
   - Provides context for AI

## Upcoming Features

### REST API Endpoints (Coming Soon)

The bot will expose API endpoints for dynamic management:

```http
# Create a new bot instance
POST /api/bots
{
  "xmppUsername": "bot@conference.main.dappros.com",
  "xmppPassword": "password",
  "firstName": "Bot",
  "lastName": "Name",
  "chatroomJid": "room@conference.main.dappros.com",
  "systemPrompt": "Custom prompt"
}

# Remove a bot instance
DELETE /api/bots/:instanceId

# Get all bot instances
GET /api/bots

# Get bot instance status
GET /api/bots/:instanceId
```

## Development

### Project Structure

```
openai-bot/
├── src/
│   ├── index.ts           # Main entry point
│   ├── BotManager.ts      # Multi-instance manager
│   ├── BotInstance.ts     # Individual bot instance
│   └── services/
│       ├── OpenAIService.ts
│       └── MemoryService.ts
├── config/
│   └── test-bots.json     # Test configuration
├── package.json
├── tsconfig.json
└── .env.example
```

### Testing Multiple Instances

1. Configure multiple bots in `config/test-bots.json`
2. Ensure each bot has unique credentials
3. Run the bot manager
4. Test by sending messages to different rooms

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check XMPP credentials and server availability
2. **Bot Not Responding**: Ensure bot is mentioned with correct first name
3. **OpenAI Errors**: Verify API key and check rate limits

### Debug Mode

Set environment variable for detailed logs:
```bash
DEBUG=xmpp:* npm run dev
```

## License

MIT