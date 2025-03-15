import { BaseBot, BaseBotConfig } from '@ethora/bot-core';
import { Logger } from 'winston';

export class TestBot extends BaseBot {
  private logger: Logger;

  constructor(config: BaseBotConfig, logger: Logger) {
    super(config);
    this.logger = logger;
  }

  protected async handleMessage(message: string, from: string): Promise<void> {
    this.logger.info('Received message', { message, from });
    // We don't need to respond to messages in test bot
  }
} 