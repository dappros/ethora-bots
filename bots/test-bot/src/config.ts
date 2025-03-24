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
  appId: process.env.APP_ID || '67d3cc45b5018b9872c16a0b',
  appToken: process.env.APP_TOKEN || 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiYXBwTmFtZSI6IkV0aG9yYSIsImRvbWFpbk5hbWUiOiJldGhvcmEiLCJkZWZhdWx0QWNjZXNzUHJvZmlsZU9wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NBc3NldHNPcGVuIjp0cnVlLCJjcmVhdGVkQXQiOiIyMDI0LTAyLTE4VDEyOjQ5OjA5LjQ5OVoiLCJ1cGRhdGVkQXQiOiIyMDI0LTAyLTE4VDEyOjQ5OjA5LjQ5OVoiLCJfX3YiOjB9LCJpYXQiOjE3MDgyNjE3NDl9.Hs5Iu_Hs5Iu_Hs5Iu_Hs5Iu_Hs5Iu_Hs5Iu_Hs5Iu_Hs5Iu',
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
