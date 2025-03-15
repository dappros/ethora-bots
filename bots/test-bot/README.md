# Ethora Test Bot

An automated testing bot for verifying core functionalities of the Ethora platform.

## Test Scenarios

The bot executes the following test scenarios in sequence:

### 1. User Creation and Authentication
- Creates a new bot user account via platform API
- Logs user ID, wallet address, and XMPP credentials
- Verifies successful user creation

### 2. XMPP Connection
- Connects to XMPP server using generated credentials
- Verifies successful connection
- Logs connection status and any errors

### 3. Room Management
- Retrieves list of available chat rooms
- Logs room details (JIDs, names, participant counts)
- If no rooms available:
  - Creates a new test room
  - Verifies room creation
  - Logs room JID and details
- If rooms exist:
  - Joins the first available room
  - Verifies successful room join
  - Logs room access status

### 4. Message Testing
- Sends initial test message to room
- Verifies message delivery
- Logs message ID and timestamp
- Waits for configured delay
- Sends a file attachment
- Verifies file upload and attachment
- Logs attachment details

## Logging

The bot provides comprehensive logging at multiple levels:

### Console Output
- Real-time execution progress
- Colorized log levels (DEBUG, INFO, WARN, ERROR)
- Structured data output for complex objects
- Timestamps for all operations

### Log Files
1. Main Log (`logs/test-bot.log`):
   - All operations and their outcomes
   - Detailed request/response data
   - Timestamps and durations
   - Rotates at 5MB, keeps 5 files

2. Error Log (`logs/error.log`):
   - Dedicated error tracking
   - Full stack traces
   - Error context and metadata

## Configuration

Create a `.env` file with the following settings:

```bash
# Bot Configuration
BOT_JID=testbot@dev.xmpp.ethoradev.com
BOT_PASSWORD=testbot123
BOT_NAME=Ethora Test Bot

# API Configuration
API_URL=https://api.ethoradev.com
APP_ID=your_app_id
API_KEY=your_api_key

# Test Configuration
CREATE_NEW_USERS=true
CREATE_NEW_ROOM=true
TEST_FILE_URL=https://picsum.photos/200/300

# Timeouts and Retries
MESSAGE_WAIT_TIME=2000
MAX_RETRIES=3
RETRY_DELAY=1000
```

## Running Tests

1. Install dependencies:
```bash
npm install
```

2. Run in development mode (with real-time TypeScript compilation):
```bash
npm run dev
```

3. Build and run in production:
```bash
npm run build
npm start
```

## Log Output Example

```
2024-03-14T20:55:23.456Z [INFO]: Starting test scenarios...
2024-03-14T20:55:23.458Z [INFO]: Creating bot user account...
2024-03-14T20:55:24.123Z [INFO]: Bot user created successfully
{
  "userId": "123456",
  "walletAddress": "0x..."
}
2024-03-14T20:55:24.234Z [INFO]: Bot connected to XMPP server
2024-03-14T20:55:24.345Z [INFO]: Retrieved room list
{
  "roomCount": 3,
  "rooms": [
    {"name": "Test Room", "jid": "room@conference..."}
  ]
}
...
```

## Error Handling

The bot handles various error scenarios:
- API connection failures
- XMPP connection issues
- Room access problems
- Message delivery failures
- File upload errors

All errors are:
1. Logged with full context
2. Retried according to configuration
3. Reported with clear error messages
4. Tracked in the error log file

## Features

- Automated testing of core platform features
- Configurable test scenarios
- Detailed logging and error reporting
- Support for existing or new test users/rooms
- File attachment testing
- Message threading verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
- Bot credentials
- API endpoints
- Test parameters
- Existing user/room details (if not creating new ones)

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Configuration Options

### Test Users
- `CREATE_NEW_USERS=true`: Create new test users
- `CREATE_NEW_USERS=false`: Use existing user credentials
  - Requires `EXISTING_USER_ID` and `EXISTING_USER_PASSWORD`

### Chat Rooms
- `CREATE_NEW_ROOM=true`: Create a new test room
- `CREATE_NEW_ROOM=false`: Use existing room
  - Requires `EXISTING_ROOM_JID`

### Timeouts
- `MESSAGE_WAIT_TIME`: Delay between message operations
- `MAX_RETRIES`: Maximum retry attempts for failed operations
- `RETRY_DELAY`: Delay between retry attempts

## Additional Test Scenarios

Consider adding these scenarios:
1. Message editing and deletion
2. Room member management (add/remove)
3. Room permission testing
4. Message reaction testing
5. User blocking/unblocking
6. Rate limit testing
7. Error condition handling
8. Message history retrieval
9. Room configuration changes
10. User presence verification

## Directory Structure

```
test-bot/
├── src/
│   ├── index.ts         # Main bot initialization
│   ├── config.ts        # Configuration management
│   └── test-scenarios.ts # Test implementation
├── package.json        # Dependencies and scripts
├── .env.example       # Environment configuration template
└── README.md          # Documentation
```
