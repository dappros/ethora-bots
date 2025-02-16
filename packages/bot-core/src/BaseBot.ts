import { client as xmppClient, xml } from '@xmpp/client'
import debug from '@xmpp/debug'
import { Client } from '@xmpp/client-core'

export interface BaseBotConfig {
  jid: string
  password: string
  roomJid: string
  botName: string
  xmppEndpoint: string
}

export interface XMPPStanza {
  is: (type: string) => boolean
  attrs: Record<string, string>
  getChild: (name: string) => { text: () => string } | null
}

export abstract class BaseBot {
  protected client: Client
  protected roomJid: string
  protected botName: string

  constructor(config: BaseBotConfig) {
    this.roomJid = config.roomJid
    this.botName = config.botName

    this.client = xmppClient({
      service: config.xmppEndpoint,
      username: config.jid.split('@')[0],
      password: config.password,
    })

    this.client.on('online', () => this.onOnline())
    this.client.on('error', (err: Error) => console.error('❌ Error:', err))
    this.client.on('stanza', (stanza: XMPPStanza) => this.onStanza(stanza))

    debug(this.client, true)
  }

  async start() {
    try {
      await this.client.start()
      console.log('🟢 Bot connected')
    } catch (err) {
      console.error('Failed to start:', err)
    }
  }

  protected async sendMessage(message: string) {
    const stanza = xml(
      'message',
      { 
        to: this.roomJid,
        type: 'groupchat',
      },
      xml('body', {}, message),
      xml('data', { 
        xmlns: 'jabber:client',
        fullName: this.botName,
        senderFirstName: this.botName,
        senderLastName: 'AI',
        showInChannel: 'true'
      })
    )
    
    await this.client.send(stanza)
  }

  protected async onOnline() {
    console.log('🟢 Bot is online')
    
    const presence = xml(
      'presence',
      { to: `${this.roomJid}/${this.client.jid!.local}` },
      xml('x', { xmlns: 'http://jabber.org/protocol/muc' }),
      xml('data', { 
        xmlns: 'jabber:client',
        fullName: this.botName,
        senderFirstName: this.botName,
        senderLastName: 'AI',
        showInChannel: 'true'
      })
    )
    
    await this.client.send(presence)
    console.log('🎯 Joined room:', this.roomJid)
  }

  protected abstract handleMessage(message: string, from: string): Promise<void>

  private async onStanza(stanza: XMPPStanza) {
    if (stanza.is('message') && stanza.attrs.type === 'groupchat') {
      const body = stanza.getChild('body')
      if (body) {
        const messageText = body.text()
        const from = stanza.attrs.from
        
        // Don't respond to our own messages
        if (from.includes(this.client.jid!.local)) {
          return
        }

        await this.handleMessage(messageText, from)
      }
    }
  }
} 