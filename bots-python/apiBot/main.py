import asyncio
import aioxmpp
import websockets
from typing import Optional, List
import os
import logging
import ssl
import datetime
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import base64
import sys
import aiohttp


class EthoraChatBot:
    def __init__(self, jid: str, password: str, room_jid: str, bot_name: str = None, verbose: bool = False):
        logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO,
                            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)

        # Bot configuration
        self.jid = aioxmpp.JID.fromstr(jid)
        self.password = password
        self.room_jid = aioxmpp.JID.fromstr(room_jid)
        self.bot_name = bot_name or "AI Assistant Python"

        # Configure connection settings
        self.websocket_url = os.getenv('XMPP_ENDPOINT', 'wss://xmpp.ethoradev.com:5443/ws')
        self.logger.info(f"Using WebSocket endpoint: {self.websocket_url}")

        parsed_url = urlparse(self.websocket_url)
        self.host = parsed_url.hostname
        self.port = parsed_url.port or 5443
        self.path = parsed_url.path or '/ws'
        self.logger.info(f"Parsed connection details - Host: {self.host}, Port: {self.port}, Path: {self.path}")

        # Set up SSL context
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

        self.websocket = None

    async def _send_stanza(self, stanza: str):
        if self.websocket:
            await self.websocket.send(stanza)
            self.logger.debug(f"Sent stanza: {stanza}")

    async def _handle_message(self, message: str):
        self.logger.debug(f"Received stanza: {message}")

        try:
            root = ET.fromstring(message)

            if root.tag == '{jabber:client}message' and root.get('type') == 'groupchat':
                body = root.find('{jabber:client}body')
                if body is not None and body.text:
                    from_jid = root.get('from')
                    if self.jid.localpart not in from_jid:
                        await self._process_message(body.text, from_jid)
        except ET.ParseError:
            self.logger.warning("Failed to parse message XML")
        except Exception as e:
            self.logger.error(f"Error handling message: {e}", exc_info=True)

    async def _process_message(self, text: str, from_jid: str):
        try:
            self.logger.info(f"Processing message from {from_jid}: {text}")

            # Send 'Processing message...'
            processing_message = (
                f'<message to="{self.room_jid}" type="groupchat">'
                f'<body>Processing message...</body>'
                f'<data xmlns="jabber:client" fullName="{self.bot_name}" '
                f'senderFirstName="{self.bot_name}" senderLastName="Assistant" '
                'showInChannel="true"/>'
                '</message>'
            )
            # Send the initial "Processing message..." message
            await self.websocket.send(processing_message)
            self.logger.debug(f"Sent processing message: {processing_message}")

            response_message = ""

            # Check for commands
            if text.startswith("/fact"):
                async with aiohttp.ClientSession() as session:
                    async with session.get("https://catfact.ninja/fact?max_length=20") as response:
                        if response.status == 200:
                            data = await response.json()
                            fact = data.get("fact", "No fact found.")
                            response_message = f"Here’s a cat fact: {fact}"
                        else:
                            response_message = "Sorry, I couldn't fetch a fact at the moment."
            elif text.startswith("/ask "):
                question = text[len("/ask "):]
                response_message = f"You sent message: '{question}'"
            else:
                response_message = "I only respond to commands starting with '/ask' or '/fact'."

            # Edit the previously sent message
            edit_message = (
                f'<message to="{self.room_jid}" type="groupchat">'
                f'<body>{response_message}</body>'
                f'<data xmlns="jabber:client" fullName="{self.bot_name}" '
                f'senderFirstName="{self.bot_name}" senderLastName="Assistant" '
                'showInChannel="true"/>'
                '</message>'
            )

            # edit_message = (
            #     f'<message to="{self.room_jid}" type="groupchat" id={'edit-message'} xmlns="jabber:client">'
            #     f'<replace id="{message_id}" text="{response_message}"/>'
            #     '</message>'
            # )

            # Send the edited message
            await self.websocket.send(edit_message)
            self.logger.debug(f"Sent edited message: {edit_message}")

        except Exception as e:
            self.logger.error(f"Error processing message: {e}")

    async def _connect(self):
        try:
            self.logger.info(f"Connecting to {self.websocket_url}")
            self.websocket = await websockets.connect(self.websocket_url, ssl=self.ssl_context,
                                                      subprotocols=['xmpp-framing'])
            self.logger.info("WebSocket connection established")

            stream_header = f'<open xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="{self.jid.domain}" version="1.0"/>'
            self.logger.debug(f"Sending stream header: {stream_header}")
            await self.websocket.send(stream_header)

            response = await self.websocket.recv()
            self.logger.debug(f"Server initial response: {response}")

            features = await self.websocket.recv()
            self.logger.debug(f"Stream features: {features}")

            auth_token = self._get_auth_token()
            self.logger.debug(f"Generated auth token for user: {self.jid.localpart}")

            auth_stanza = f'<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">{auth_token}</auth>'
            self.logger.debug(f"Sending auth stanza: {auth_stanza}")
            await self.websocket.send(auth_stanza)

            auth_response = await self.websocket.recv()
            self.logger.debug(f"Auth response: {auth_response}")

            if '<success' not in auth_response:
                error_msg = f"Authentication failed. Response: {auth_response}"
                self.logger.error(error_msg)
                raise Exception(error_msg)

            self.logger.info("Authentication successful")

            await self.websocket.send(stream_header)

            response = await self.websocket.recv()
            self.logger.debug(f"New stream response: {response}")

            bind_stanza = f'<iq type="set" id="bind"><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"><resource>{self.jid.resource or "bot"}</resource></bind></iq>'
            self.logger.debug(f"Sending bind stanza: {bind_stanza}")
            await self.websocket.send(bind_stanza)

            bind_response = await self.websocket.recv()
            self.logger.debug(f"Bind response: {bind_response}")

            session_stanza = '<iq type="set" id="session"><session xmlns="urn:ietf:params:xml:ns:xmpp-session"/></iq>'
            self.logger.debug(f"Sending session stanza: {session_stanza}")
            await self.websocket.send(session_stanza)

            session_response = await self.websocket.recv()
            self.logger.debug(f"Session response: {session_response}")

            presence = f'<presence to="{self.room_jid}/{self.jid.localpart}"><x xmlns="http://jabber.org/protocol/muc"/><data xmlns="jabber:client" fullName="{self.bot_name}" senderFirstName="{self.bot_name}" senderLastName="Assistant" showInChannel="true"/></presence>'
            self.logger.debug(f"Sending presence stanza: {presence}")
            await self.websocket.send(presence)

            welcome_message = f'<message to="{self.room_jid}" type="groupchat"><body>👋 Hello! I\'m {self.bot_name}, your assistant. I\'m here to help answer your questions and participate in discussions. Feel free to chat with me!</body><data xmlns="jabber:client" fullName="{self.bot_name}" senderFirstName="{self.bot_name}" senderLastName="Assistant" showInChannel="true"/></message>'
            self.logger.debug(f"Sending welcome message: {welcome_message}")
            await self.websocket.send(welcome_message)

            return True

        except Exception as e:
            self.logger.error(f"Connection error: {str(e)}", exc_info=True)
            if self.websocket:
                await self.websocket.close()
            return False

    def _get_auth_token(self) -> str:
        auth_str = f"\x00{self.jid.localpart}\x00{self.password}"
        token = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
        self.logger.debug(f"Generated auth token for user: {self.jid.localpart}")
        return token

    async def _listen(self):
        try:
            while True:
                message = await self.websocket.recv()
                await self._handle_message(message)
        except websockets.ConnectionClosed:
            self.logger.warning("WebSocket connection closed")
        except Exception as e:
            self.logger.error(f"Error in message listener: {e}", exc_info=True)

    async def start(self):
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

    bot_jid = '0xe_e6f278e_b_b_d_e_c2_f1c_ddc_e_dc_b117_b8263_f9f2a5_ea@xmpp.ethoradev.com'
    bot_password = '5y6uuu6pmk'
    room_jid = '6706332db1b1a4e984d3c7bc-0193e469-e77e-7e65-89b5-50a65975b783@conference.xmpp.ethoradev.com'
    bot_name = 'Bot DxBot'

    try:
        logger.info("Creating bot instance...")
        bot = EthoraChatBot(jid=bot_jid, password=bot_password, room_jid=room_jid, bot_name=bot_name, verbose=True)

        logger.info("Starting bot...")
        await bot.start()
    except Exception as e:
        logger.error(f"Bot error: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                        handlers=[logging.StreamHandler()])
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
