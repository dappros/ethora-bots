# ethora_bot.py
import asyncio
import aioxmpp
import openai
import websockets
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
import ssl
import datetime
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import base64
import sys

class EthoraChatBot:
    def __init__(self, jid: str, password: str, room_jid: str, openai_key: str, bot_name: str = None, verbose: bool = False):
        # Logging setup first
        logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO,
                          format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Bot configuration
        self.jid = aioxmpp.JID.fromstr(jid)
        self.password = password
        self.room_jid = aioxmpp.JID.fromstr(room_jid)
        self.bot_name = bot_name or "AI Assistant Python"
        self.message_history: List[dict] = [
            {"role": "system", "content": "You are a helpful AI assistant in a group chat. Keep responses concise and friendly."}
        ]
        
        # Configure connection settings
        self.websocket_url = os.getenv('XMPP_ENDPOINT', 'wss://xmpp.ethoradev.com:5443/ws')
        self.logger.info(f"Using WebSocket endpoint: {self.websocket_url}")
        
        # Parse the WebSocket URL
        parsed_url = urlparse(self.websocket_url)
        self.host = parsed_url.hostname
        self.port = parsed_url.port or 5443
        self.path = parsed_url.path or '/ws'
        self.logger.info(f"Parsed connection details - Host: {self.host}, Port: {self.port}, Path: {self.path}")
        
        # Set up SSL context
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        # OpenAI setup
        self.client = openai.OpenAI(api_key=openai_key)
        
        # WebSocket connection
        self.websocket = None
        
    async def _send_stanza(self, stanza: str):
        """Send an XMPP stanza over WebSocket"""
        if self.websocket:
            await self.websocket.send(stanza)
            self.logger.debug(f"Sent stanza: {stanza}")
    
    async def _handle_message(self, message: str):
        """Handle incoming XMPP stanza"""
        self.logger.debug(f"Received stanza: {message}")
        
        try:
            # Parse XML message
            root = ET.fromstring(message)
            
            # Check if it's a message stanza
            if root.tag == '{jabber:client}message' and root.get('type') == 'groupchat':
                body = root.find('{jabber:client}body')
                if body is not None and body.text:
                    from_jid = root.get('from')
                    # Don't respond to our own messages
                    if self.jid.localpart not in from_jid:
                        await self._process_message(body.text, from_jid)
        except ET.ParseError:
            self.logger.warning("Failed to parse message XML")
        except Exception as e:
            self.logger.error(f"Error handling message: {e}", exc_info=True)
    
    async def _process_message(self, text: str, from_jid: str):
        """Process and respond to a chat message"""
        try:
            self.logger.info(f"Processing message from {from_jid}: {text}")
            
            # Add user message to history
            self.message_history.append({
                "role": "user",
                "content": text
            })
            
            # Keep history limited to last 10 messages
            if len(self.message_history) > 11:  # 1 system message + 10 conversation messages
                self.message_history = [
                    self.message_history[0],  # Keep system message
                    *self.message_history[-10:]  # Keep last 10 messages
                ]
            
            # Generate AI response
            response = await self._generate_response(text)
            
            if response:
                # Add AI response to history
                self.message_history.append({
                    "role": "assistant",
                    "content": response
                })
                
                # Send response message
                message = (
                    f'<message to="{self.room_jid}" type="groupchat">'
                    f'<body>{response}</body>'
                    f'<data xmlns="jabber:client" fullName="{self.bot_name}" '
                    f'senderFirstName="{self.bot_name}" senderLastName="AI" '
                    'showInChannel="true"/>'
                    '</message>'
                )
                await self.websocket.send(message)
                self.logger.debug(f"Sent response message: {message}")
        
        except Exception as e:
            self.logger.error(f"Error processing message: {e}", exc_info=True)
            error_message = (
                f'<message to="{self.room_jid}" type="groupchat">'
                '<body>Sorry, I encountered an error processing your message.</body>'
                f'<data xmlns="jabber:client" fullName="{self.bot_name}" '
                f'senderFirstName="{self.bot_name}" senderLastName="AI" '
                'showInChannel="true"/>'
                '</message>'
            )
            await self.websocket.send(error_message)
    
    async def _generate_response(self, message: str) -> str:
        """Generate AI response using OpenAI"""
        try:
            completion = await asyncio.to_thread(
                self.client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=self.message_history,
                temperature=0.7
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            self.logger.error(f"Error generating AI response: {e}", exc_info=True)
            return "Sorry, I encountered an error generating a response."
    
    async def _connect(self):
        """Establish WebSocket connection"""
        try:
            self.logger.info(f"Connecting to {self.websocket_url}")
            self.websocket = await websockets.connect(
                self.websocket_url,
                ssl=self.ssl_context,
                subprotocols=['xmpp-framing']
            )
            self.logger.info("WebSocket connection established")
            
            # Initial stream header
            stream_header = (
                f'<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" '
                f'to="{self.jid.domain}" version="1.0"/>'
            )
            self.logger.debug(f"Sending stream header: {stream_header}")
            await self.websocket.send(stream_header)
            
            # Wait for server response
            response = await self.websocket.recv()
            self.logger.debug(f"Server initial response: {response}")
            
            # Wait for features
            features = await self.websocket.recv()
            self.logger.debug(f"Stream features: {features}")
            
            # Authenticate
            auth_token = self._get_auth_token()
            self.logger.debug(f"Generated auth token for user: {self.jid.localpart}")
            
            auth_stanza = (
                '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" '
                'mechanism="PLAIN">'
                f'{auth_token}'
                '</auth>'
            )
            self.logger.debug(f"Sending auth stanza: {auth_stanza}")
            await self.websocket.send(auth_stanza)
            
            # Wait for auth response
            auth_response = await self.websocket.recv()
            self.logger.debug(f"Auth response: {auth_response}")
            
            if '<success' not in auth_response:
                error_msg = f"Authentication failed. Response: {auth_response}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
            
            self.logger.info("Authentication successful")
            
            # Start new stream after auth
            await self.websocket.send(stream_header)
            
            # Wait for new stream response
            response = await self.websocket.recv()
            self.logger.debug(f"New stream response: {response}")
            
            # Bind resource
            bind_stanza = (
                '<iq type="set" id="bind">'
                '<bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">'
                f'<resource>{self.jid.resource or "bot"}</resource>'
                '</bind>'
                '</iq>'
            )
            self.logger.debug(f"Sending bind stanza: {bind_stanza}")
            await self.websocket.send(bind_stanza)
            
            # Wait for bind response
            bind_response = await self.websocket.recv()
            self.logger.debug(f"Bind response: {bind_response}")
            
            # Start session
            session_stanza = (
                '<iq type="set" id="session">'
                '<session xmlns="urn:ietf:params:xml:ns:xmpp-session"/>'
                '</iq>'
            )
            self.logger.debug(f"Sending session stanza: {session_stanza}")
            await self.websocket.send(session_stanza)
            
            # Wait for session response
            session_response = await self.websocket.recv()
            self.logger.debug(f"Session response: {session_response}")
            
            # Join MUC room
            presence = (
                f'<presence to="{self.room_jid}/{self.jid.localpart}">'
                '<x xmlns="http://jabber.org/protocol/muc"/>'
                f'<data xmlns="jabber:client" fullName="{self.bot_name}" '
                f'senderFirstName="{self.bot_name}" senderLastName="AI" '
                'showInChannel="true"/>'
                '</presence>'
            )
            self.logger.debug(f"Sending presence stanza: {presence}")
            await self.websocket.send(presence)
            
            # Send welcome message
            welcome_message = (
                f'<message to="{self.room_jid}" type="groupchat">'
                f'<body>👋 Hello! I\'m {self.bot_name}, an AI assistant powered by OpenAI. '
                'I\'m here to help answer your questions and participate in discussions. '
                'Feel free to chat with me!</body>'
                f'<data xmlns="jabber:client" fullName="{self.bot_name}" '
                f'senderFirstName="{self.bot_name}" senderLastName="AI" '
                'showInChannel="true"/>'
                '</message>'
            )
            self.logger.debug(f"Sending welcome message: {welcome_message}")
            await self.websocket.send(welcome_message)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Connection error: {str(e)}", exc_info=True)
            if self.websocket:
                await self.websocket.close()
            return False
    
    def _get_auth_token(self) -> str:
        """Generate SASL PLAIN authentication token"""
        # For SASL PLAIN, the format is: \x00username\x00password
        auth_str = f"\x00{self.jid.localpart}\x00{self.password}"
        token = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        self.logger.debug(f"Generated auth token for user: {self.jid.localpart}")
        return token
    
    async def _listen(self):
        """Listen for incoming messages"""
        try:
            while True:
                message = await self.websocket.recv()
                await self._handle_message(message)
        except websockets.ConnectionClosed:
            self.logger.warning("WebSocket connection closed")
        except Exception as e:
            self.logger.error(f"Error in message listener: {e}", exc_info=True)
    
    async def start(self):
        """Start the bot"""
        try:
            self.logger.info("Starting bot...")
            if await self._connect():
                self.logger.info("Bot connected successfully")
                await self._listen()
            else:
                self.logger.error("Failed to connect")
        except Exception as e:
            self.logger.error(f"Error starting bot: {e}", exc_info=True)
            raise

async def main():
    logger = logging.getLogger(__name__)
    logger.info("Loading environment variables...")
    load_dotenv()
    
    # Get configuration from environment
    bot_jid = os.getenv("BOT_JID")
    bot_password = os.getenv("BOT_PASSWORD")
    room_jid = os.getenv("ROOM_JID")
    openai_key = os.getenv("OPENAI_API_KEY")
    bot_name = os.getenv("BOT_NAME", "AI Assistant Python")
    
    logger.info("Checking environment variables...")
    # Validate required environment variables
    required_vars = {
        "BOT_JID": bot_jid,
        "BOT_PASSWORD": bot_password,
        "ROOM_JID": room_jid,
        "OPENAI_API_KEY": openai_key
    }
    
    missing_vars = [var for var, value in required_vars.items() if not value]
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    logger.info("Environment variables loaded successfully")
    logger.info(f"Initializing bot with JID: {bot_jid}")
    logger.info(f"Target room: {room_jid}")
    logger.info(f"XMPP endpoint: {os.getenv('XMPP_ENDPOINT', 'wss://xmpp.ethoradev.com:5443/ws')}")
    
    try:
        logger.info("Creating bot instance...")
        bot = EthoraChatBot(
            jid=bot_jid,
            password=bot_password,
            room_jid=room_jid,
            openai_key=openai_key,
            bot_name=bot_name,
            verbose=True
        )
        
        logger.info("Starting bot...")
        await bot.start()
    except Exception as e:
        logger.error(f"Bot error: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    # Configure logging first
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info("Starting bot script...")
    logger.info("Python version: %s", sys.version)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error("Bot failed with error: %s", str(e), exc_info=True)
        sys.exit(1)
