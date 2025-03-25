import { config } from './config';
import { TestBotCleanup } from './cleanup';

async function main() {
  try {
    const cleanup = new TestBotCleanup(config);
    await cleanup.run();
  } catch (error) {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  }
}

main(); 