import dotenv from 'dotenv'
import { OpenAIBot } from './OpenAIBot'

dotenv.config()

const bot = new OpenAIBot({
  jid: process.env.BOT_JID!,
  password: process.env.BOT_PASSWORD!,
  roomJid: process.env.ROOM_JID!,
  openaiKey: process.env.OPENAI_API_KEY!,
  botName: process.env.BOT_NAME || 'OpenAI Assistant'
})

bot.start() 