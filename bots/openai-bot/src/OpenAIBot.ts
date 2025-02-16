import { BaseBot, BaseBotConfig } from '@ethora/bot-core'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

interface OpenAIBotConfig extends BaseBotConfig {
  openaiKey: string
}

export class OpenAIBot extends BaseBot {
  private openai: OpenAI
  private chatHistory: ChatCompletionMessageParam[] = []

  constructor(config: OpenAIBotConfig) {
    super(config)
    
    this.openai = new OpenAI({
      apiKey: config.openaiKey
    })

    this.chatHistory = [{
      role: "system",
      content: "You are a helpful AI assistant in a group chat. Keep responses concise and friendly."
    } as ChatCompletionMessageParam]
  }

  protected async handleMessage(message: string, from: string): Promise<void> {
    try {
      // Add user message to history
      this.chatHistory.push({
        role: "user",
        content: message
      } as ChatCompletionMessageParam)

      // Keep history limited to last 10 messages
      if (this.chatHistory.length > 11) {
        this.chatHistory = [
          this.chatHistory[0],
          ...this.chatHistory.slice(-10)
        ]
      }

      // Generate AI response
      const completion = await this.openai.chat.completions.create({
        messages: this.chatHistory,
        model: "gpt-3.5-turbo",
        temperature: 0.7
      })

      const response = completion.choices[0].message.content

      if (response) {
        // Add AI response to history
        this.chatHistory.push({
          role: "assistant",
          content: response
        } as ChatCompletionMessageParam)

        await this.sendMessage(response)
      }
    } catch (error) {
      console.error('Error processing message:', error)
    }
  }
} 