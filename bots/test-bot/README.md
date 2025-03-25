# Ethora Test Bot

A comprehensive test bot for the Ethora platform that validates various chat room functionalities and XMPP integration.

## Features

The test bot performs the following operations:

1. User Management:
   - Creates a bot user account with unique credentials
   - Generates server tokens for authentication
   - Handles XMPP client initialization

2. Room Management:
   - Creates new chat rooms
   - Joins existing rooms
   - Lists available rooms
   - Updates room settings
   - Manages room participants

3. Message Operations:
   - Sends text messages
   - Sends messages with mentions
   - Sends messages with links
   - Sends file attachments (images, documents)
   - Reacts to messages with emojis
   - Edits messages
   - Replies to messages
   - Deletes messages

4. Cleanup Operations:
   - Finds all test users and rooms
   - Lists test data for review
   - Confirms deletion with user
   - Removes test users and rooms
   - Logs cleanup results

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Access to Ethora platform API
- XMPP server access

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ethora-bots/bots/test-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the test-bot directory with the following configuration:
```env
API_URL=https://dev.api.ethoradev.com
APP_ID=your_app_id
APP_TOKEN=your_app_token
XMPP_DOMAIN=dev.xmpp.ethoradev.com
XMPP_ENDPOINT=wss://dev.xmpp.ethoradev.com:5443/ws
TEST_FILE_URL=https://example.com/test-file.jpg
```

## Configuration

The bot can be configured through environment variables or command-line arguments:

- `API_URL`: The base URL of the Ethora API
- `APP_ID`: Your application ID
- `APP_TOKEN`: Your application token
- `XMPP_DOMAIN`: The XMPP server domain
- `XMPP_ENDPOINT`: The WebSocket endpoint for XMPP
- `TEST_FILE_URL`: URL of a test file for attachment testing
- `CREATE_NEW_ROOM`: Whether to create a new room (true/false)
- `EXISTING_ROOM_JID`: JID of an existing room to join

## Usage

1. Run the bot in development mode:
```bash
npm run dev
```

2. Run the bot in production mode:
```bash
npm start
```

3. Run tests:
```bash
npm test
```

4. Run cleanup script:
```bash
npm run cleanup
```

The cleanup script will:
1. Find all test users and rooms
2. Display a list of found test data
3. Ask for confirmation before deletion
4. Remove confirmed test data
5. Log the results

## Test Scenarios

The bot runs the following test scenarios in sequence:

1. User Creation:
   - Generates unique bot user credentials
   - Creates a bot user account
   - Initializes XMPP client

2. Room Setup:
   - Creates a new room or joins an existing one
   - Validates room access and permissions

3. Message Testing:
   - Basic text messaging
   - Message mentions
   - Link sharing
   - File attachments
   - Message reactions
   - Message editing
   - Message replies
   - Message deletion

4. Room Management:
   - Participant listing
   - Room information retrieval
   - Room settings updates
   - Room leave/rejoin

## Logging

The bot uses Winston for logging. Logs are stored in the `logs` directory with the following files:
- `test-bot.log`: Main application logs
- `error.log`: Error-specific logs

## Error Handling

The bot includes comprehensive error handling for:
- API request failures
- XMPP connection issues
- Authentication errors
- Room access problems
- Message delivery failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
