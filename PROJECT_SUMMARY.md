# Ethora Bots Project

## Overview
This repository contains a collection of chat bots for the Ethora platform. It includes a core bot framework and various bot implementations that can be deployed to interact with users in Ethora chat rooms.

## Architecture

### Bot Core (@ethora/bot-core)
The core framework provides base functionality for connecting to and interacting with Ethora's Chat Server. It handles:
- XMPP connection management
- Message handling
- Room presence
- Basic bot configuration

### Bot Implementations
Each bot in the `bots/` directory is a separate implementation using the core framework. Currently includes:
- OpenAI Bot: Integrates OpenAI's GPT model for intelligent chat responses

## Technical Details

### XMPP Protocol
Ethora uses XMPP (Extensible Messaging and Presence Protocol) for real-time communication. Key aspects:
- WebSocket connection to xmpp.ethoradev.com
- MUC (Multi-User Chat) for room-based conversations
- Custom data extensions for user information
- Message stanzas with type="groupchat"

### Message Format
Messages include:
- Standard XMPP body
- Custom data node with user information:
  - fullName
  - senderFirstName
  - senderLastName
  - showInChannel flag

## Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Ethora platform account for bot credentials
- API keys for specific bot implementations (e.g., OpenAI API key)

### Setup
1. Clone repository
2. Install dependencies in both core and bot directories
3. Copy .env.example to .env and configure
4. Build core package
5. Build and run desired bot

### Creating New Bots
1. Create new directory in `bots/`
2. Extend BaseBot class
3. Implement handleMessage method
4. Add configuration and dependencies

## Deployment
Detailed deployment instructions are provided in each bot's README.md file.

## Security Notes
- Never commit .env files with real credentials
- Keep API keys secure
- Follow security best practices for production deployments

## License
[Add your chosen license] 