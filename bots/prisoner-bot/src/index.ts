import dotenv from 'dotenv'
import { PrisonerBot } from './PrisonerBot'

dotenv.config()

// Log configuration (without sensitive data)
console.log('Starting bot with config:', {
  jid: process.env.BOT_JID,
  roomJid: process.env.ROOM_JID,
  endpoint: process.env.XMPP_ENDPOINT,
  botName: process.env.BOT_NAME
})

const bot = new PrisonerBot({
  jid: process.env.BOT_JID!,
  password: process.env.BOT_PASSWORD!,
  roomJid: process.env.ROOM_JID!,
  botName: process.env.BOT_NAME || "Prisoner's Dilemma Bot",
  xmppEndpoint: process.env.XMPP_ENDPOINT || 'wss://xmpp.ethoradev.com:5443/ws'
})

async function main() {
  try {
    console.log('Attempting to start bot...')
    await bot.start()
    console.log('🤖 Prisoner\'s Dilemma bot started successfully')
  } catch (error) {
    console.error('Failed to start bot:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
}) 