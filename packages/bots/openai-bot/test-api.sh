#!/bin/bash

# API Configuration
API_URL="http://localhost:3000"
API_KEY="test_secret_key_123"

echo "=== OpenAI Bot API Test Script ==="
echo

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
curl -s $API_URL/health | jq .
echo

# Test 2: Get All Bots (should be empty initially)
echo "2. Getting all bot instances..."
curl -s -H "Authorization: Bearer $API_KEY" $API_URL/api/bots | jq .
echo

# Test 3: Create a Bot Instance
echo "3. Creating a new bot instance..."
BOT_RESPONSE=$(curl -s -X POST $API_URL/api/bots \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "xmppUsername": "test-bot-1@conference.main.dappros.com",
    "xmppPassword": "test123456",
    "firstName": "TestBot",
    "lastName": "One",
    "chatroomJid": "test-room-1@conference.main.dappros.com",
    "systemPrompt": "You are a helpful test bot. Always be friendly and concise."
  }')

echo "$BOT_RESPONSE" | jq .
BOT_ID=$(echo "$BOT_RESPONSE" | jq -r .id)
echo

# Test 4: Get Specific Bot
echo "4. Getting specific bot instance..."
curl -s -H "Authorization: Bearer $API_KEY" $API_URL/api/bots/$BOT_ID | jq .
echo

# Test 5: Create Another Bot
echo "5. Creating another bot instance..."
curl -s -X POST $API_URL/api/bots \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "xmppUsername": "test-bot-2@conference.main.dappros.com",
    "xmppPassword": "test654321",
    "firstName": "CodeBot",
    "lastName": "Helper",
    "chatroomJid": "dev-room@conference.main.dappros.com",
    "systemPrompt": "You are a programming assistant. Help with code and technical questions."
  }' | jq .
echo

# Test 6: Get All Bots Again
echo "6. Getting all bot instances (should show 2)..."
curl -s -H "Authorization: Bearer $API_KEY" $API_URL/api/bots | jq .
echo

echo "Test completed! Check the bot manager console for connection status."