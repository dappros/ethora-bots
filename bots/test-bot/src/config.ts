import dotenv from 'dotenv';

dotenv.config();

export interface TestConfig {
  // Bot Configuration
  botJid: string;
  botPassword: string;
  botName: string;
  roomJid?: string;

  // API Configuration
  apiUrl: string;
  appId: string;
  apiKey: string;
  appToken: string;

  // Test Configuration
  createNewUsers: boolean;
  createNewRoom: boolean;
  existingUserId?: string;
  existingUserPassword?: string;
  existingRoomJid?: string;
  testFileUrl: string;

  // Timeouts and Retries
  messageWaitTime: number;
  maxRetries: number;
  retryDelay: number;
}

export const config: TestConfig = {
  // Bot Configuration
  botJid: process.env.BOT_JID || '',
  botPassword: process.env.BOT_PASSWORD || '',
  botName: process.env.BOT_NAME || 'Ethora Test Bot',
  roomJid: process.env.ROOM_JID,

  // API Configuration
  apiUrl: process.env.API_URL || 'http://localhost:8080',
  appId: process.env.APP_ID || '',
  apiKey: process.env.API_KEY || '',
  appToken: process.env.APP_TOKEN || '',

  // Test Configuration
  createNewUsers: process.env.CREATE_NEW_USERS === 'true',
  createNewRoom: process.env.CREATE_NEW_ROOM === 'true',
  existingUserId: process.env.EXISTING_USER_ID,
  existingUserPassword: process.env.EXISTING_USER_PASSWORD,
  existingRoomJid: process.env.EXISTING_ROOM_JID,
  testFileUrl: process.env.TEST_FILE_URL || 'https://example.com/test.jpg',

  // Timeouts and Retries
  messageWaitTime: parseInt(process.env.MESSAGE_WAIT_TIME || '1000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
};
