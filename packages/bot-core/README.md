# @ethora/bot-core

Core framework for building XMPP bots for the Ethora platform.

## Installation

```bash
npm install @ethora/bot-core
```

## Usage

```typescript
import { BaseBot, BotConfig } from '@ethora/bot-core';

class MyBot extends BaseBot {
  protected async onMessage(from: string, message: string): Promise<void> {
    // Handle incoming messages
    await this.sendMessage(`You said: ${message}`);
  }
}

const config: BotConfig = {
  jid: 'your-bot@xmpp.example.com',
  xmppWebsocketUrl: 'wss://xmpp.example.com:5443/ws',
  password: 'your-password',
  roomJid: 'room@conference.xmpp.example.com',
  botName: 'My Bot'
};

const bot = new MyBot(config);
await bot.start();
```

## Features

- XMPP client integration
- Automatic room joining
- Message handling
- Presence management
- Error handling
- TypeScript support

## API

### BotConfig

```typescript
interface BotConfig {
  jid: string;              // Bot's JID
  xmppWebsocketUrl: string; // XMPP server WebSocket URL
  password: string;         // Bot's password
  roomJid: string;         // Room JID to join
  botName: string;         // Bot's display name
}
```

### BaseBot

The `BaseBot` class provides the following methods:

- `start()`: Start the bot and connect to the XMPP server
- `sendMessage(message: string)`: Send a message to the room
- `onMessage(from: string, message: string)`: Abstract method to handle incoming messages
- `onOnline()`: Method called when the bot comes online
- `onStanza(stanza: any)`: Method called when a stanza is received

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## License

MIT 