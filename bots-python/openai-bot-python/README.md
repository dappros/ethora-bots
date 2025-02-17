# OpenAI Bot (Python Version)

A Python implementation of the OpenAI-powered chatbot for Ethora platform.

## Features

- XMPP-based chat integration
- OpenAI GPT-3.5 Turbo integration
- Message history tracking
- Proper error handling
- Configurable bot name and behavior

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Edit `.env` file with your credentials:
```env
BOT_JID=your_bot_jid@xmpp.ethoradev.com
BOT_PASSWORD=your_bot_password
ROOM_JID=room_id@conference.xmpp.ethoradev.com
OPENAI_API_KEY=your_openai_api_key
BOT_NAME=AI Assistant Python
```

## Running the Bot

Start the bot:
```bash
python ethora_bot.py
```

## Features

- Maintains conversation history for context
- Automatically reconnects on disconnection
- Proper XMPP presence handling
- Configurable message formatting
- Detailed logging for debugging

## Troubleshooting

If you encounter issues:

1. Check your credentials in `.env`
2. Ensure you have proper network connectivity
3. Check the logs for detailed error messages
4. Verify your OpenAI API key is valid

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 