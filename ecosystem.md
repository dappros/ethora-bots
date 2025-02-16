This is a guide to deploying multiple bots on a single server instance, managed by pm2.

# Deployment steps

# On your Digital Ocean droplet
git clone https://github.com/dappros/ethora-bots.git
cd ethora-bots

# Build core package
cd packages/bot-core
npm install
npm run build
npm link

# Setup OpenAI bot
cd ../../bots/openai-bot
npm install
npm link @ethora/bot-core
cp .env.example .env
# Edit .env with actual credentials

# Setup Prisoner bot
cd ../prisoner-bot
npm install
npm link @ethora/bot-core
cp .env.example .env
# Edit .env with actual credentials

# Go back to root and start both bots
cd ../..
pm2 start ecosystem.config.js

# Useful pm2 commands (examples)

# 1. View logs: 
pm2 logs                 # View all logs
pm2 logs openai-bot      # View only OpenAI bot logs
pm2 logs prisoner-bot    # View only Prisoner's Dilemma bot logs

2. Monitor processes:
pm2 monit               # Opens an interactive monitor
pm2 status             # Shows status of all processes

3. Process management:
pm2 stop all           # Stop all bots
pm2 stop openai-bot    # Stop specific bot
pm2 restart all        # Restart all bots
pm2 delete all         # Remove all processes from PM2

