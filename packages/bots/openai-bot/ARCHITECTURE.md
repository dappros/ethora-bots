# Multi-Tenant Bot Architecture

## Overview

The OpenAI bot has been transformed from a single-instance application to a multi-tenant system capable of managing multiple bot connections simultaneously within a single process. This architecture allows the Ethora platform to dynamically create and manage bot instances for different applications.

## Key Design Decisions

### 1. Single Process, Multiple Connections
- **Approach**: One Node.js process manages multiple XMPP connections
- **Benefits**: Resource efficient, centralized management, shared OpenAI API key
- **Trade-offs**: All bots share the same process resources

### 2. Instance Isolation
- Each bot instance maintains its own:
  - XMPP connection
  - Message handlers
  - Conversation memory
  - System prompt context

### 3. Dynamic Management
- Bots can be created/removed at runtime
- Configuration can be loaded from files or API
- RESTful API for programmatic control

## Architecture Components

### BotManager
The central orchestrator that manages all bot instances.

**Responsibilities:**
- Create/remove bot instances
- Track instance lifecycle
- Load configurations
- Provide status information

**Key Methods:**
- `createInstance(config)`: Creates a new bot
- `removeInstance(id)`: Stops and removes a bot
- `loadFromFile(path)`: Bulk load configurations
- `getStatus()`: Returns all instance statuses

### BotInstance
Individual bot connection wrapper.

**Responsibilities:**
- Manage XMPP connection
- Handle incoming messages
- Maintain conversation context
- Generate OpenAI responses

**Lifecycle:**
1. Created by BotManager with configuration
2. Connects to XMPP server
3. Joins specified chatroom
4. Processes messages until stopped
5. Cleanly disconnects when removed

### OpenAIService
Handles OpenAI API interactions.

**Features:**
- Custom system prompts per instance
- Conversation history context
- Error handling and fallbacks

### MemoryService
Manages conversation history per user.

**Features:**
- In-memory storage (can be extended to persistent storage)
- Configurable history limit
- User-based isolation

### API Server
RESTful API for dynamic bot management.

**Endpoints:**
- `POST /api/bots`: Create new bot instance
- `GET /api/bots`: List all instances
- `GET /api/bots/:id`: Get specific instance
- `PUT /api/bots/:id`: Update instance
- `DELETE /api/bots/:id`: Remove instance

**Security:**
- Bearer token authentication
- Configurable API secret

## Data Flow

### Message Processing
1. XMPP message received by BotInstance
2. Check if bot is mentioned (@FirstName)
3. Retrieve user conversation history
4. Generate response with OpenAI (using custom prompt)
5. Store conversation in memory
6. Send response back via XMPP

### Instance Creation (via API)
1. Ethora backend sends POST to `/api/bots`
2. API validates credentials and configuration
3. BotManager creates new BotInstance
4. BotInstance connects to XMPP
5. Bot joins specified chatroom
6. API returns success with instance details

## Configuration

### Environment Variables
```env
OPENAI_API_KEY=xxx          # Shared OpenAI API key
ENABLE_API=true             # Enable REST API
API_PORT=3000               # API server port
API_HOST=localhost          # API server host
API_SECRET_KEY=xxx          # API authentication
BOT_CONFIG_FILE=xxx         # Initial config file
```

### Bot Configuration Schema
```json
{
  "id": "unique-identifier",
  "xmppUsername": "bot@domain.com",
  "xmppPassword": "secure-password",
  "firstName": "Bot",
  "lastName": "Name",
  "chatroomJid": "room@conference.domain.com",
  "systemPrompt": "Custom AI personality"
}
```

## Scaling Considerations

### Current Limitations
- All bots run in single process
- Memory-based conversation storage
- Shared rate limits for OpenAI API

### Future Enhancements
1. **Horizontal Scaling**
   - Multiple bot manager instances
   - Load balancing across processes
   - Shared state via Redis/database

2. **Persistent Storage**
   - Database for conversation history
   - Configuration management system
   - Audit logging

3. **Advanced Features**
   - WebSocket API for real-time updates
   - Metrics and monitoring
   - Rate limiting per instance
   - Custom LLM models per instance

## Integration with Ethora

### Workflow
1. App owner creates bot user in Ethora admin panel
2. Ethora backend calls bot API to create instance
3. Bot connects and joins specified chatroom
4. Users interact with bot via mentions
5. App owner can update/remove bot via admin panel

### Security
- API authentication prevents unauthorized access
- Each bot has isolated XMPP credentials
- No cross-contamination between instances

## Error Handling

### Connection Failures
- Automatic retry with exponential backoff
- Instance marked as inactive
- Error logged for debugging

### API Errors
- Validation errors return 400 with details
- Not found errors return 404
- Server errors return 500 with generic message

### Runtime Errors
- Isolated to individual instances
- Bot continues operating for other instances
- Graceful degradation for failed instances

## Monitoring and Debugging

### Logging
- Instance-specific log prefixes
- Connection status changes
- Message processing events
- Error stack traces

### Debug Mode
```bash
DEBUG=xmpp:* npm run dev
```

### Health Checks
- `/health` endpoint for uptime monitoring
- Instance status via API
- Connection state tracking