import { BaseBot, BotConfig } from '@ethora/bot-core';
import winston from 'winston';

export class TestBot extends BaseBot {
  private logger: winston.Logger;

  constructor(config: BotConfig, logger: winston.Logger) {
    super(config);
    this.logger = logger;
  }

  protected onMessage(from: string, message: string): void {
    this.logger.info(`Received message from ${from}: ${message}`);
    
    // Echo the message back
    this.sendMessage(`Echo: ${message}`).catch(err => {
      this.logger.error('Failed to send message:', err);
    });
  }
} 