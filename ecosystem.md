# Running Multiple Bots with PM2

This guide explains how to deploy and manage multiple bots on a single server instance using PM2 process manager.

## Initial Setup

First, clone and set up the repository:

```bash
# Clone the repository
git clone https://github.com/dappros/ethora-bots.git
cd ethora-bots

# Build core package
cd packages/bot-core
npm install
npm run build
npm link
```

## Bot Configuration

### OpenAI Bot Setup
```bash
cd ../../bots/openai-bot
npm install
npm link @ethora/bot-core
cp .env.example .env
# Edit .env with your OpenAI bot credentials
```

### Prisoner's Dilemma Bot Setup
```bash
cd ../prisoner-bot
npm install
npm link @ethora/bot-core
cp .env.example .env
# Edit .env with your Prisoner bot credentials
```

## Starting the Bots

Return to the root directory and start both bots using PM2:
```bash
cd ../..
pm2 start ecosystem.config.js
```

## PM2 Management Commands

### Viewing Logs
```bash
pm2 logs                 # View all logs
pm2 logs openai-bot      # View only OpenAI bot logs
pm2 logs prisoner-bot    # View only Prisoner's Dilemma bot logs
```

### Monitoring
```bash
pm2 monit               # Opens an interactive monitor
pm2 status             # Shows status of all processes
```

### Process Management
```bash
pm2 stop all           # Stop all bots
pm2 stop openai-bot    # Stop specific bot
pm2 restart all        # Restart all bots
pm2 delete all         # Remove all processes from PM2
```

## Additional PM2 Features

### Auto-restart on System Boot
```bash
pm2 startup            # Generate startup script
pm2 save              # Save current process list
```

### Monitoring Memory/CPU
```bash
pm2 status            # Basic status
pm2 monit             # Detailed real-time monitoring
```

