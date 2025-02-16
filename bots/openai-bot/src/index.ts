import dotenv from 'dotenv'
import { OpenAIBot } from './OpenAIBot'

dotenv.config()

const bot = new OpenAIBot({
  jid: process.env.BOT_JID!,
  password: process.env.BOT_PASSWORD!,
  roomJid: process.env.ROOM_JID!,
  botName: process.env.BOT_NAME || 'OpenAI Assistant',
  openaiKey: process.env.OPENAI_API_KEY!,
  xmppEndpoint: process.env.XMPP_ENDPOINT || 'wss://xmpp.ethoradev.com:5443/ws'
})

async function main() {
  try {
    await bot.start()
    console.log('🤖 OpenAI bot started successfully')
  } catch (error) {
    console.error('Failed to start bot:', error)
    process.exit(1)
  }
}

main() 