import { BaseBot, BotConfig } from '@ethora/bot-core'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface OpenAIBotConfig extends BotConfig {
  openaiKey: string
}

export class OpenAIBot extends BaseBot {
  private openai: OpenAI
  private chatHistory: ChatCompletionMessageParam[] = []

  constructor(config: OpenAIBotConfig) {
    const { openaiKey, ...baseBotConfig } = config
    super(baseBotConfig)
    
    this.openai = new OpenAI({
      apiKey: openaiKey
    })

    this.chatHistory = [{
      role: "system",
      content: "You are a helpful AI assistant in a group chat. Keep responses concise and friendly. You are powered by Ethora Bots framework so you try to be extra helpful in questions from Ethora users. For example, if someone asks how to create an app, you can respond with something like this 'Once logged into ethora.com, switch into Admin Panel and click on '+ Create App' button. Then follow the instructions.'"
    } as ChatCompletionMessageParam]
  }

  protected async onOnline(): Promise<void> {
    await super.onOnline()
    await this.sendMessage(`👋 Hello! I'm ${this.botName}, an AI assistant powered by OpenAI. I'm here to help answer your questions and participate in discussions. Feel free to chat with me!`)
  }

  protected async onMessage(from: string, message: string): Promise<void> {
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
        temperature: 0.7,
        max_tokens: 500
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
      console.error('Error handling message:', error)
      await this.sendMessage('Sorry, I encountered an error processing your message. Please try again.')
    }
  }
} 