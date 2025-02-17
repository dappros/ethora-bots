# ethora_bot.py
import asyncio
import slixmpp
import openai
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
import ssl
import datetime
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

class EthoraChatBot(slixmpp.ClientXMPP):
    def __init__(self, jid: str, password: str, room_jid: str, openai_key: str, bot_name: str = None, verbose: bool = False):
        super().__init__(jid, password)
        
        # Logging setup first
        logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO,
                          format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Set slixmpp logger to debug
        logging.getLogger('slixmpp').setLevel(logging.DEBUG)
        
        # Enable slixmpp debug logging
        self.register_plugin('feature_mechanisms', module='slixmpp.features.feature_mechanisms')
        self.register_plugin('feature_bind', module='slixmpp.features.feature_bind')
        self.register_plugin('feature_session', module='slixmpp.features.feature_session')
        
        # Bot configuration
        self.room_jid = room_jid
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
        self.logger.info(f"Parsed connection details - Host: {self.host}, Port: {self.port}")
        
        # Configure connection
        self.whitespace_keepalive = True  # Important for WebSocket
        self.whitespace_keepalive_interval = 60  # Send keepalive every 60 seconds
        
        # Set up SSL context
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        # Set connection method to websockets
        self.use_websockets = True
        self.default_domain = self.host
        self.default_port = self.port
        
        # Register XMPP plugins
        self.register_plugin('xep_0045')  # Multi-User Chat
        self.register_plugin('xep_0199')  # XMPP Ping
        self.register_plugin('xep_0085')  # Chat State Notifications
        
        # OpenAI setup
        self.client = openai.OpenAI(api_key=openai_key)
        
        # Add event handlers
        self._setup_handlers()

    def _setup_handlers(self):
        """Set up all event handlers"""
        # Connection handlers
        self.add_event_handler("connecting", self.on_connecting)
        self.add_event_handler("connected", self.on_connected)
        self.add_event_handler("disconnected", self.on_disconnected)
        self.add_event_handler("failed_auth", self.on_failed_auth)
        self.add_event_handler("socket_error", self.on_socket_error)
        
        # Session and message handlers
        self.add_event_handler("session_start", self.start)
        self.add_event_handler("groupchat_message", self.muc_message)
        self.add_event_handler("muc::%s::presence" % self.room_jid, self.muc_presence)
        
        # Stream handlers
        self.add_event_handler("stream_negotiated", self.on_stream_negotiated)
        self.add_event_handler("stream_error", self.on_stream_error)
        
        # DNS handlers
        self.add_event_handler("dns_resolved", self.on_dns_resolved)
        self.add_event_handler("dns_error", self.on_dns_error)

    def on_stream_error(self, event):
        """Handle stream errors"""
        self.logger.error(f"Stream error: {event}")
        self.logger.debug(f"Stream error details: {event}")
        self.logger.debug(f"Current JID: {self.boundjid.full}")

    def on_connecting(self, event):
        """Handle connecting event"""
        self.logger.info("Connecting to server...")
        self.logger.debug(f"Connection event details: {event}")
        self.logger.debug(f"Socket info - Host: {self.host}, Port: {self.port}")

    def on_connected(self, event):
        """Handle connected event"""
        self.logger.info("Connected to server!")
        self.logger.debug(f"Connection event details: {event}")
        self.logger.debug(f"Bound JID: {self.boundjid.full}")
        self.logger.debug(f"Target room: {self.room_jid}")

    def on_disconnected(self, event):
        """Handle disconnection"""
        self.logger.warning("Disconnected from server!")
        self.logger.debug(f"Disconnection event details: {event}")
        self.logger.debug(f"Will attempt to reconnect")

    def on_failed_auth(self, event):
        """Handle authentication failures"""
        self.logger.error("Failed authentication!")
        self.logger.debug(f"Auth failure event: {event}")
        self.logger.debug(f"JID used: {self.boundjid.full}")

    def on_socket_error(self, error):
        """Handle socket errors"""
        self.logger.error(f"Socket error: {error}")
        self.logger.debug(f"Socket error details: {error}")
        self.logger.debug(f"Connection info - Host: {self.host}, Port: {self.port}")

    def on_stream_negotiated(self, event):
        """Called when stream is negotiated"""
        self.logger.info("Stream negotiated! Attempting to join room...")
        try:
            # Send initial presence with MUC join
            presence = self.Presence()
            presence['to'] = f"{self.room_jid}/{self.boundjid.local}"
            presence['from'] = self.boundjid.full
            
            # Add MUC namespace
            x = ET.Element('{http://jabber.org/protocol/muc}x')
            presence.xml.append(x)
            
            # Add data element with bot info
            data = ET.Element('data')
            data.set('xmlns', 'jabber:client')
            data.set('fullName', self.bot_name)
            data.set('senderFirstName', self.bot_name)
            data.set('senderLastName', 'AI')
            data.set('showInChannel', 'true')
            presence.xml.append(data)
            
            self.logger.debug(f"Sending presence stanza: {presence}")
            self.send(presence)
            self.logger.info(f"Sent join presence to room: {self.room_jid}")
            
            # Send welcome message after a short delay
            asyncio.create_task(self._send_delayed_welcome())
        except Exception as e:
            self.logger.error(f"Error in stream negotiation: {e}", exc_info=True)

    async def _send_delayed_welcome(self):
        """Send welcome message after a short delay to ensure room join is complete"""
        try:
            self.logger.info("Waiting 2 seconds before sending welcome message...")
            await asyncio.sleep(2)  # Wait 2 seconds
            
            message = self.Message()
            message['to'] = self.room_jid
            message['type'] = 'groupchat'
            message['body'] = f"👋 Hello! I'm {self.bot_name}, ready to help!"
            
            # Add data element
            data = ET.Element('data')
            data.set('xmlns', 'jabber:client')
            data.set('fullName', self.bot_name)
            data.set('senderFirstName', self.bot_name)
            data.set('senderLastName', 'AI')
            data.set('showInChannel', 'true')
            message.xml.append(data)
            
            self.logger.debug(f"Sending welcome message stanza: {message}")
            self.send(message)
            self.logger.info("Sent welcome message successfully")
        except Exception as e:
            self.logger.error(f"Error sending welcome message: {e}", exc_info=True)

    def muc_presence(self, presence):
        """Handle MUC presence stanzas"""
        self.logger.info(f"MUC Presence received - From: {presence['from']}, Type: {presence['type']}")
        self.logger.debug(f"Full presence stanza: {presence}")

    async def start(self, event):
        """Process the session_start event."""
        try:
            self.logger.info("Session started, sending initial presence...")
            await self.get_roster()
            self.send_presence()
            
            # Join the MUC room
            self.logger.info(f"Attempting to join room: {self.room_jid}")
            await self.plugin['xep_0045'].join_muc(
                self.room_jid,
                self.boundjid.local,
                wait=True
            )
            self.logger.info(f"Successfully joined room: {self.room_jid}")
            
            # Send welcome message after joining
            await self._send_delayed_welcome()
        except Exception as e:
            self.logger.error(f"Error in session start: {e}", exc_info=True)

    async def muc_message(self, msg):
        """Handle incoming MUC messages"""
        if msg['mucnick'] != self.boundjid.local and msg['body']:
            try:
                self.logger.info(f"Processing message from {msg['mucnick']}: {msg['body']}")
                
                # Update message history
                self.message_history.append({
                    "role": "user",
                    "content": msg['body']
                })
                
                # Keep history limited to last 10 messages
                if len(self.message_history) > 11:
                    self.message_history = [
                        self.message_history[0],  # Keep system message
                        *self.message_history[-10:]  # Keep last 10 messages
                    ]
                
                response = await self._get_ai_response()
                if response:
                    # Add response to history
                    self.message_history.append({
                        "role": "assistant",
                        "content": response
                    })
                    
                    # Create message stanza
                    message = self.Message()
                    message['to'] = self.room_jid
                    message['type'] = 'groupchat'
                    message['body'] = response
                    
                    # Add data element
                    data = ET.Element('data')
                    data.set('xmlns', 'jabber:client')
                    data.set('fullName', self.bot_name)
                    data.set('senderFirstName', self.bot_name)
                    data.set('senderLastName', 'AI')
                    data.set('showInChannel', 'true')
                    message.xml.append(data)
                    
                    self.send(message)
                    self.logger.info(f"Sent response: {response[:50]}...")
            except Exception as e:
                self.logger.error(f"Error processing message: {e}", exc_info=True)

    async def _get_ai_response(self) -> Optional[str]:
        """Get response from OpenAI"""
        try:
            completion = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=self.message_history,
                temperature=0.7,
                max_tokens=150
            )
            return completion.choices[0].message.content
        except Exception as e:
            self.logger.error(f"OpenAI API error: {e}")
            return "Sorry, I encountered an error processing your message."

    def connect(self):
        """Override connect method to use websockets"""
        try:
            self.logger.info("Starting connection process...")
            self.logger.info(f"Connecting to {self.host}:{self.port} using WebSocket")
            self.logger.info(f"JID: {self.boundjid.full}")
            self.logger.info(f"Using WebSockets: {self.use_websockets}")
            self.logger.info(f"SSL Verification: {self.ssl_context.verify_mode}")
            
            # Set up connection parameters
            address = (self.host, self.port)
            
            # Configure resolver settings
            self.use_srv = False  # Don't use SRV records
            self.dns_service = True  # But still use DNS
            
            # Connect using WebSocket
            self.logger.info("Initiating connection...")
            result = super().connect(
                address=address,
                use_ssl=True,
                disable_starttls=True,
                force_starttls=False
            )
            
            self.logger.info(f"Connection result: {result}")
            return result
        except Exception as e:
            self.logger.error(f"Connection error: {e}", exc_info=True)
            raise

    def on_dns_resolved(self, event):
        """Handle successful DNS resolution"""
        self.logger.info("DNS resolved successfully")
        self.logger.debug(f"DNS resolution details: {event}")

    def on_dns_error(self, event):
        """Handle DNS resolution errors"""
        self.logger.error("DNS resolution failed")
        self.logger.debug(f"DNS error details: {event}")

def main():
    load_dotenv()
    
    # Get configuration from environment
    bot_jid = os.getenv("BOT_JID")
    bot_password = os.getenv("BOT_PASSWORD")
    room_jid = os.getenv("ROOM_JID")
    openai_key = os.getenv("OPENAI_API_KEY")
    bot_name = os.getenv("BOT_NAME", "AI Assistant Python")
    
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
    
    logging.info(f"Initializing bot with JID: {bot_jid}")
    logging.info(f"Target room: {room_jid}")
    
    try:
        bot = EthoraChatBot(
            jid=bot_jid,
            password=bot_password,
            room_jid=room_jid,
            openai_key=openai_key,
            bot_name=bot_name,
            verbose=True
        )
        
        bot.connect()
        bot.process(forever=True)
    except Exception as e:
        logging.error(f"Bot error: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    main()
