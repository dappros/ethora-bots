#!/usr/bin/env python3
"""
Test script for the OpenAI Bot API
Demonstrates how to create and manage bot instances
"""

import requests
import json
import time

# API Configuration
API_URL = "http://localhost:3000"
API_KEY = "test_secret_key_123"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def test_health():
    """Test the health endpoint"""
    print("1. Testing Health Endpoint...")
    response = requests.get(f"{API_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def get_all_bots():
    """Get all bot instances"""
    print("Getting all bot instances...")
    response = requests.get(f"{API_URL}/api/bots", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    return response.json()

def create_bot(bot_data):
    """Create a new bot instance"""
    print(f"Creating bot: {bot_data['firstName']} {bot_data['lastName']}...")
    response = requests.post(f"{API_URL}/api/bots", headers=headers, json=bot_data)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}\n")
    return result

def get_bot(bot_id):
    """Get a specific bot instance"""
    print(f"Getting bot {bot_id}...")
    response = requests.get(f"{API_URL}/api/bots/{bot_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def delete_bot(bot_id):
    """Delete a bot instance"""
    print(f"Deleting bot {bot_id}...")
    response = requests.delete(f"{API_URL}/api/bots/{bot_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def main():
    print("=== OpenAI Bot API Test ===\n")
    
    # Test 1: Health check
    test_health()
    
    # Test 2: Get all bots (should be empty or show existing from config)
    print("2. Initial bot list:")
    get_all_bots()
    
    # Test 3: Create first bot
    print("3. Creating first bot instance:")
    bot1_data = {
        "xmppUsername": "support-bot@conference.main.dappros.com",
        "xmppPassword": "secure_password_123",
        "firstName": "Support",
        "lastName": "Bot",
        "chatroomJid": "support-room@conference.main.dappros.com",
        "systemPrompt": "You are a technical support assistant. Help users troubleshoot issues and provide clear solutions."
    }
    bot1 = create_bot(bot1_data)
    
    # Test 4: Create second bot
    print("4. Creating second bot instance:")
    bot2_data = {
        "xmppUsername": "code-bot@conference.main.dappros.com",
        "xmppPassword": "secure_password_456",
        "firstName": "Code",
        "lastName": "Assistant",
        "chatroomJid": "dev-room@conference.main.dappros.com",
        "systemPrompt": "You are a programming assistant. Provide code examples, explain algorithms, and help with debugging."
    }
    bot2 = create_bot(bot2_data)
    
    # Test 5: Get all bots again
    print("5. Updated bot list:")
    all_bots = get_all_bots()
    
    # Test 6: Get specific bot
    if all_bots and len(all_bots) > 0:
        print("6. Getting specific bot details:")
        get_bot(all_bots[0]['id'])
    
    print("\nTest completed!")
    print("Note: The bots will try to connect to the XMPP server.")
    print("If the credentials are invalid, you'll see connection errors in the bot manager console.")
    print("\nTo test with real credentials, update the bot_data dictionaries above with:")
    print("- Valid XMPP usernames and passwords")
    print("- Existing chatroom JIDs")

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the API server.")
        print("Make sure the bot manager is running with: npm run dev")
    except Exception as e:
        print(f"ERROR: {e}")