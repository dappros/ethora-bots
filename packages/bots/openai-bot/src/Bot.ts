import { client as xmppClient } from '@xmpp/client';
import { EventEmitter } from 'events';

export interface BotConfig {
  username: string;
  password: string;
  service: string;
  domain: string;
}

export interface Message {
  from: string;
  to: string;
  body: string;
  type: string;
}

export class Bot extends EventEmitter {
  client: any;
  private config: BotConfig;

  constructor(config: BotConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    this.client = xmppClient({
      service: this.config.service,
      username: this.config.username,
      password: this.config.password,
      domain: this.config.domain,
    });

    this.client.on('online', () => {
      console.log(`Bot ${this.config.username} connected`);
      this.emit('online');
    });

    this.client.on('stanza', (stanza: any) => {
      if (stanza.is('message') && stanza.attrs.type === 'groupchat') {
        const body = stanza.getChildText('body');
        if (body) {
          const message: Message = {
            from: stanza.attrs.from,
            to: stanza.attrs.to,
            body: body,
            type: stanza.attrs.type
          };
          this.emit('message', message);
        }
      }
    });

    this.client.on('error', (err: Error) => {
      console.error('XMPP Error:', err);
      this.emit('error', err);
    });

    await this.client.start();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.stop();
    }
  }

  async joinRoom(roomJid: string): Promise<void> {
    const presence = {
      name: 'presence',
      attrs: {
        to: `${roomJid}/${this.config.username}`
      },
      children: [
        {
          name: 'x',
          attrs: { xmlns: 'http://jabber.org/protocol/muc' }
        }
      ]
    };
    await this.client.send(presence);
  }

  async sendMessage(to: string, body: string): Promise<void> {
    const message = {
      name: 'message',
      attrs: {
        to: to,
        type: 'groupchat'
      },
      children: [
        {
          name: 'body',
          children: [body]
        }
      ]
    };
    await this.client.send(message);
  }
}