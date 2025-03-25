import dotenv from 'dotenv';

dotenv.config();

export interface TestBotConfig {
  apiUrl: string;
  appId: string;
  appToken: string;
  botName: string;
  createNewRoom: boolean;
  existingRoomJid?: string;
  existingUserId?: string;
  existingUserPassword?: string;
  messageWaitTime: number;
  maxRetries: number;
  retryDelay: number;
  testFileUrl: string;
  xmppDomain: string;
  xmppEndpoint: string;
}

export const config: TestBotConfig = {
  apiUrl: process.env.API_URL || 'https://dev.api.ethoradev.com',
  appId: process.env.APP_ID || '',
  appToken: process.env.APP_TOKEN || '',
  botName: process.env.BOT_NAME || 'Ethora Test Bot',
  createNewRoom: process.env.CREATE_NEW_ROOM === 'true',
  existingRoomJid: process.env.EXISTING_ROOM_JID,
  existingUserId: process.env.EXISTING_USER_ID,
  existingUserPassword: process.env.EXISTING_USER_PASSWORD,
  messageWaitTime: parseInt(process.env.MESSAGE_WAIT_TIME || '2000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
  testFileUrl: process.env.TEST_FILE_URL || 'https://picsum.photos/200/300',
  xmppDomain: process.env.XMPP_DOMAIN || 'dev.xmpp.ethoradev.com',
  xmppEndpoint: process.env.XMPP_ENDPOINT || 'wss://dev.xmpp.ethoradev.com:5443/ws',
};
