# Ethora Bots

This repository contains a collection of chatbots for the Ethora platform. It's structured as a monorepo containing a core bot framework and various bot implementations.

You can run one bot individually or multiple bots at once in different chat rooms using PM2. See ecosystem.md for latter option.

## Repository Structure

```
ethora-bots/
├── packages/
│   └── bot-core/          # Core bot framework
└── bots/
    └── openai-bot/        # OpenAI-powered chatbot
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/dappros/ethora-bots.git
cd ethora-bots
```

2. Build and link the core package:
```bash
cd packages/bot-core
npm install
npm run build
sudo npm link
cd ../..
```

3. Setup the OpenAI bot:
```bash
cd bots/openai-bot
npm install
npm link @ethora/bot-core
```

4. Create a configuration file `.env` in the bot directory:
```env
BOT_JID=your-bot@xmpp.example.com
BOT_PASSWORD=your-bot-password
ROOM_JID=room@conference.xmpp.example.com
BOT_NAME=AI Assistant
OPENAI_API_KEY=your-openai-api-key
```

5. Start the bot:
```bash
npm start
```

## Production Deployment Guide

### Server Setup (Ubuntu)

1. Connect to your server:
```bash
ssh root@your-server-ip
```

2. Update system packages:
```bash
apt update && apt upgrade -y
```

3. Install Node.js and npm:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

4. Install PM2 for process management:
```bash
npm install -g pm2
```

### Bot Deployment

1. Clone the repository:
```bash
git clone https://github.com/dappros/ethora-bots.git
cd ethora-bots
```

2. Build and setup the core package:
```bash
cd packages/bot-core
npm install
npm run build
sudo npm link
cd ../..
```

3. Setup the OpenAI bot:
```bash
cd bots/openai-bot
npm install
npm link @ethora/bot-core
```

4. Create the environment configuration:
```bash
nano .env
```
Add your configuration as shown in the Local Development Setup section.

5. Start the bot with PM2:
```bash
pm2 start npm --name "ethora-openai-bot" -- start
```

6. Enable startup on system boot:
```bash
pm2 startup
pm2 save
```

### Monitoring and Maintenance

- View bot logs:
```bash
pm2 logs ethora-openai-bot
```

- Monitor bot status:
```bash
pm2 status
```

- Restart the bot:
```bash
pm2 restart ethora-openai-bot
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Links

- [GitHub Repository](https://github.com/dappros/ethora-bots)
- [Report Issues](https://github.com/dappros/ethora-bots/issues) 