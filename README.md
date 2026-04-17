# Ethora Bots

Collection of chat bots for the Ethora platform plus a small reusable bot framework. Run a bot in one chat room, or run several bots across different rooms with PM2 (see `ecosystem.md`).

**Part of the [Ethora SDK ecosystem](https://github.com/dappros/ethora#ecosystem)** — see all SDKs, tools, and sample apps. Follow cross-SDK updates in the [Release Notes](https://github.com/dappros/ethora/blob/main/RELEASE-NOTES.md).

## Repository structure

```
ethora-bots/
├── packages/
│   └── bot-core/                       # Reusable Node.js / TS bot framework (XMPP, MUC, helpers)
├── bots/
│   ├── openai-bot/                     # OpenAI / GPT-powered chat bot (TypeScript)
│   ├── prisoner-bot/                   # Prisoner's Dilemma demo bot (TypeScript)
│   └── test-bot/                       # E2E / smoke-test bot (TypeScript)
└── bots-python/
    ├── openai-bot-python/              # OpenAI bot in Python (slixmpp)
    └── apiBot/                         # Reference Python API + XMPP bot
```

## Default backend endpoints

All bots default to the canonical Ethora Cloud production endpoints:

| Purpose | Default value |
|---------|---------------|
| API base URL | `https://api.chat.ethora.com` |
| XMPP WebSocket | `wss://xmpp.chat.ethora.com:5443/ws` |
| XMPP host | `xmpp.chat.ethora.com` |
| XMPP MUC (conference) | `conference.xmpp.chat.ethora.com` |
| Sign up / get bot credentials | [app.chat.ethora.com](https://app.chat.ethora.com) |
| API docs (Swagger) | [api.chat.ethora.com/api-docs/#/](https://api.chat.ethora.com/api-docs/#/) |

To target QA, point the equivalent env vars (`API_URL`, `XMPP_DOMAIN`, `XMPP_ENDPOINT`, etc.) at `chat-qa.ethora.com`. To self-host, override with your own domain.

## Prerequisites

- Node.js v18+ and npm v9+ (for TypeScript bots)
- Python 3.10+ (for `bots-python/*`)
- An Ethora account at [app.chat.ethora.com](https://app.chat.ethora.com) — create an app, then create a bot user inside it to obtain a `BOT_JID`, `BOT_PASSWORD`, and `ROOM_JID`.

## Quick start (Node.js, OpenAI bot)

```bash
git clone https://github.com/dappros/ethora-bots.git
cd ethora-bots

# 1. Build and link the shared core
cd packages/bot-core
npm install
npm run build
sudo npm link
cd ../..

# 2. Install the bot
cd bots/openai-bot
npm install
npm link @ethora/bot-core
```

Create `.env` in `bots/openai-bot/` (see `.env.example`):

```env
BOT_JID=your-bot@xmpp.chat.ethora.com   # bot user JID from app.chat.ethora.com
BOT_PASSWORD=your-bot-password
ROOM_JID=room@conference.xmpp.chat.ethora.com
BOT_NAME=AI Assistant
OPENAI_API_KEY=sk-...
# Optional override (default is wss://xmpp.chat.ethora.com:5443/ws)
# XMPP_ENDPOINT=wss://xmpp.chat.ethora.com:5443/ws
```

Start the bot:

```bash
npm start
```

## Quick start (Python, OpenAI bot)

```bash
cd bots-python/openai-bot-python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit with your credentials
python ethora_bot.py
```

## Production deployment with PM2

The Node bots are designed to run under PM2 for process supervision and auto-restart.

### Server prep (Ubuntu)

```bash
ssh root@your-server
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
npm install -g pm2
```

### Deploy a bot

Repeat the **Quick start (Node.js, OpenAI bot)** steps on the server, then:

```bash
cd bots/openai-bot
pm2 start npm --name "ethora-openai-bot" -- start
pm2 save
pm2 startup        # follow the printed command to enable on boot
```

To remove auto-startup later: `pm2 unstartup systemd`.

### Monitoring

```bash
pm2 status                        # high-level state
pm2 logs ethora-openai-bot        # tail logs
pm2 logs ethora-openai-bot --err  # errors only
pm2 monit                         # CPU / memory live
pm2 restart ethora-openai-bot
```

## XMPP protocol notes

The bots follow the latest Ethora XMPP protocol:

- Use `type="bot"` on presence and message stanzas.
- Do not include name fields inside stanzas (set `BOT_NAME` instead).
- Use the standard MUC namespace for room interactions.

For a deeper protocol walkthrough see `chatProtocol.md`.

## Security

- **Never** commit `.env` files containing real `BOT_PASSWORD`, `OPENAI_API_KEY`, etc.
- If a bot password is exposed in code or logs, rotate it from `app.chat.ethora.com` (delete the bot user, recreate, regenerate password) before redeploying.

## Related

- [`@ethora/chat-component`](https://github.com/dappros/ethora-chat-component) — React.js chat SDK
- [`ethora-mcp-cli`](https://github.com/dappros/ethora-mcp-cli) — MCP server for IDE / AI agent integration
- [`rag_demos`](https://github.com/dappros/rag_demos) — RAG examples that pair well with these bots
- [Ethora monorepo](https://github.com/dappros/ethora) — full ecosystem entry point
- API docs (Swagger): [api.chat.ethora.com/api-docs/#/](https://api.chat.ethora.com/api-docs/#/)

## Contributing

Contributions are welcome — please open an issue first for non-trivial changes, then submit a PR.

## License

MIT — see [LICENSE](./LICENSE).

## Links

- [GitHub repository](https://github.com/dappros/ethora-bots)
- [Report issues](https://github.com/dappros/ethora-bots/issues)
- [Forum](https://forum.ethora.com/) · [Discord](https://discord.gg/Sm6bAHA3ZC)
