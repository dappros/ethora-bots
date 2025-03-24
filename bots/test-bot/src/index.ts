import dotenv from 'dotenv';

// Load environment variables before any other imports
dotenv.config();

import { TestBot } from './bot';
import { config } from './config';
import { TestScenarios } from './test-scenarios';
import { Element } from '@xmpp/xml'
import { logger } from './logger';

interface XMPPStanza extends Omit<Element, 'getChild'> {
  attrs: {
    from?: string;
    to?: string;
    type?: string;
    id?: string;
  };
  getChild(name: string): Element | undefined;
}

async function main() {
  try {
    // Initialize test scenarios
    const testScenarios = new TestScenarios(config, logger);

    // Run all test scenarios
    await testScenarios.run();
  } catch (error) {
    logger.error('Main process failed', { error });
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Unhandled error in main process', { error });
  process.exit(1);
});
