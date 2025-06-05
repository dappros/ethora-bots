import { Bot } from '@ethora/bot-core';
import { OpenAIService } from './services/OpenAIService';
import { MemoryService } from './services/MemoryService';

export interface BotConfig {
  id: string;
  xmppUsername: string;
  xmppPassword: string;
  firstName: string;
  lastName: string;
  chatroomJid: string;
  systemPrompt: string;
}

export class BotInstance {
  private bot: Bot | null = null;
  private openAI: OpenAIService;
  private memory: MemoryService;
  private isRunning = false;

  constructor(
    private config: BotConfig,
    openAIApiKey: string
  ) {
    this.openAI = new OpenAIService(openAIApiKey);
    this.memory = new MemoryService();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Bot instance ${this.config.id} is already running`);
      return;
    }

    try {
      console.log(`Starting bot instance: ${this.config.id}`);
      
      // Extract username from full JID
      const username = this.config.xmppUsername.split('@')[0];
      
      // Create bot with instance-specific credentials
      this.bot = new Bot({
        username: username,
        password: this.config.xmppPassword,
        service: `wss://${this.config.xmppUsername.split('@')[1].replace('conference.', '')}/ws`,
        domain: this.config.xmppUsername.split('@')[1].replace('conference.', ''),
      });

      // Set bot profile
      if (this.bot.client) {
        this.bot.client.botName = `${this.config.firstName} ${this.config.lastName}`;
      }

      // Handle messages
      this.bot.on('message', async (message) => {
        console.log(`[${this.config.id}] Received message:`, message.body);

        if (!message.body || message.body.trim() === '') return;

        try {
          // Check if bot is mentioned
          const botMention = `@${this.config.firstName}`;
          if (!message.body.includes(botMention)) return;

          // Remove mention from message
          const cleanMessage = message.body.replace(botMention, '').trim();

          // Get conversation history
          const conversationHistory = await this.memory.getConversationHistory(
            message.from,
            10
          );

          // Generate response with custom system prompt
          const response = await this.openAI.generateResponse(
            cleanMessage,
            conversationHistory,
            this.config.systemPrompt
          );

          // Store messages in memory
          await this.memory.addMessage(message.from, 'user', cleanMessage);
          await this.memory.addMessage(message.from, 'assistant', response);

          // Send response
          await this.bot!.sendMessage(message.from, response);
          console.log(`[${this.config.id}] Sent response:`, response);
        } catch (error) {
          console.error(`[${this.config.id}] Error handling message:`, error);
          await this.bot!.sendMessage(
            message.from,
            'Sorry, I encountered an error processing your request.'
          );
        }
      });

      // Connect to XMPP
      await this.bot.connect();
      
      // Join the specified chatroom
      await this.bot.joinRoom(this.config.chatroomJid);
      console.log(`[${this.config.id}] Joined room: ${this.config.chatroomJid}`);

      this.isRunning = true;
      console.log(`Bot instance ${this.config.id} started successfully`);
    } catch (error) {
      console.error(`Failed to start bot instance ${this.config.id}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log(`Bot instance ${this.config.id} is not running`);
      return;
    }

    try {
      console.log(`Stopping bot instance: ${this.config.id}`);
      
      if (this.bot) {
        await this.bot.disconnect();
        this.bot = null;
      }

      this.isRunning = false;
      console.log(`Bot instance ${this.config.id} stopped successfully`);
    } catch (error) {
      console.error(`Error stopping bot instance ${this.config.id}:`, error);
      throw error;
    }
  }

  getId(): string {
    return this.config.id;
  }

  getConfig(): BotConfig {
    return { ...this.config };
  }

  isActive(): boolean {
    return this.isRunning;
  }
}