import { client as xmppClient, xml } from '@xmpp/client'
import debug from '@xmpp/debug'
import { Client } from '@xmpp/client-core'
import { EventEmitter } from 'events'
import xmpp from '@xmpp/client'

export interface BotConfig {
  jid: string
  xmppWebsocketUrl: string
  password: string
  roomJid: string
  botName: string
}

export abstract class BaseBot extends EventEmitter {
  protected config: BotConfig
  protected xmppClient: Client
  protected roomJid: string
  protected botName: string

  constructor(config: BotConfig) {
    super();
    this.config = config;
    this.roomJid = config.roomJid;
    this.botName = config.botName;
    const [username, domain] = config.jid.split('@');

    console.log('🤖 Creating bot instance:', {
      jid: config.jid,
      xmppWebsocketUrl: config.xmppWebsocketUrl,
      roomJid: config.roomJid,
      botName: config.botName,
      username,
      domain,
      password: config.password.substring(0, 3) + '...' + config.password.substring(config.password.length - 3)
    });

    const wsUrl = config.xmppWebsocketUrl.replace('ws://', 'wss://').replace(/\/?$/, '/ws');
    console.log('🔌 WebSocket URL:', wsUrl);

    this.xmppClient = xmpp.client({
      service: wsUrl,
      username: username,
      password: config.password,
      domain: domain,
      resource: 'bot'
    });

    this.xmppClient.on('connect', () => {
      console.log('🔄 XMPP client connecting...');
    });

    this.xmppClient.on('online', () => {
      console.log('🟢 XMPP client online:', {
        jid: this.xmppClient.jid?.toString(),
        resource: this.xmppClient.jid?.getResource(),
        local: this.xmppClient.jid?.getLocal(),
        domain: this.xmppClient.jid?.getDomain(),
      });
      this.onOnline();
    });

    this.xmppClient.on('error', (err: Error) => {
      console.error('❌ XMPP client error:', {
        error: err.message,
        stack: err.stack,
        name: err.name,
      });
    });

    this.xmppClient.on('offline', () => {
      console.log('🔴 XMPP client offline');
    });

    this.xmppClient.on('stanza', (stanza: any) => {
      console.log('📨 XMPP stanza received:', {
        name: stanza.name,
        attrs: stanza.attrs,
        children: stanza.children.map((child: any) => ({
          name: child.name,
          attrs: child.attrs,
          text: child.children?.[0],
        })),
      });

      if (stanza.is('features')) {
        const mechanisms = stanza.getChild('mechanisms');
        if (mechanisms) {
          console.log('🔐 Available SASL mechanisms:', {
            mechanisms: mechanisms.children.map((m: any) => m.children[0]),
          });

          const auth = xml(
            'auth',
            { xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl', mechanism: 'PLAIN' },
            Buffer.from(`\x00${username}\x00${config.password}`).toString('base64')
          );
          console.log('🔑 Sending SASL PLAIN auth:', {
            username,
            base64: Buffer.from(`\x00${username}\x00${config.password}`).toString('base64'),
          });
          this.xmppClient.send(auth);
        }
      }

      if (stanza.is('failure')) {
        console.error('❌ Authentication failure:', {
          condition: stanza.getChild('not-authorized')?.name,
          text: stanza.getChildText('text'),
          username,
          password: config.password.substring(0, 3) + '...' + config.password.substring(config.password.length - 3)
        });
      }

      this.onStanza(stanza);
    });

    debug(this.xmppClient, true)
  }

  async start() {
    try {
      console.log('🚀 Starting XMPP client...');
      await this.xmppClient.start()
      console.log('🟢 Bot connected')
    } catch (err: any) {
      console.error('❌ Error starting bot:', {
        error: err.message,
        stack: err.stack,
        name: err.name,
      })
      throw err
    }
  }

  protected async sendMessage(message: string) {
    console.log('📤 Sending message:', {
      to: this.roomJid,
      message
    });

    const stanza = xml(
      'message',
      { to: this.roomJid, type: 'groupchat' },
      xml('body', {}, message)
    )
    
    await this.xmppClient.send(stanza)
  }

  protected async onOnline() {
    console.log('🎯 Joining room:', this.roomJid);

    const presence = xml(
      'presence',
      { to: `${this.roomJid}/${this.xmppClient.jid!.local}` },
      xml('x', { xmlns: 'http://jabber.org/protocol/muc' }),
      xml('data', { 
        xmlns: 'http://jabber.org/protocol/muc#user',
        type: 'bot',
        name: this.botName
      })
    )
    
    await this.xmppClient.send(presence)
    console.log('✅ Joined room:', this.roomJid)
  }

  protected onStanza(stanza: any) {
    if (stanza.is('message') && stanza.attrs.type === 'groupchat') {
      const body = stanza.getChild('body')
      if (body) {
        const from = stanza.attrs.from.split('/')[1]
        const message = body.text()
        
        // Don't respond to our own messages
        if (from.includes(this.xmppClient.jid!.local)) {
          return
        }

        console.log('📩 Received message:', {
          from,
          message
        });

        this.onMessage(from, message)
      }
    }
  }

  protected abstract onMessage(from: string, message: string): void;
} 