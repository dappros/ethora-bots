import axios from 'axios';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import { TestConfig } from './config';
import { Logger } from 'winston';

interface UserResponse {
  ok: boolean;
  results: Array<{
    _id: string;
    xmppPassword: string;
    defaultWallet: {
      walletAddress: string;
    };
    token: string;
  }>;
}

interface BotUser {
  id: string;
  password: string;
  walletAddress: string;
  accessToken: string;
}

interface RoomResponse {
  jid: string;
  name: string;
  description: string;
}

interface RoomListResponse {
  items: Array<{
    jid: string;
    name: string;
    description: string;
    participants: number;
  }>;
}

interface MessageResponse {
  id: string;
}

export class TestScenarios {
  private config: TestConfig;
  private logger: Logger;
  private botUser: BotUser | null = null;
  private roomJid: string = '';
  private lastMessageId: string = '';

  constructor(config: TestConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Creates a server token for b2b authentication
   */
  private createServerToken(): string {
    return jwt.sign(
      { 
        data: { 
          appId: this.config.appId, 
          type: 'server'
        } 
      }, 
      this.config.apiKey, 
      {
        algorithm: 'HS256'
      }
    );
  }

  /**
   * Creates a bot user account
   */
  async createBotUser(): Promise<void> {
    this.logger.info('Creating bot user account...');

    // Generate unique identifiers using timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const email = `ethora.test.bot.${timestamp}.${randomStr}@ethora.bot`.toLowerCase();
    const uuid = `testbot-${timestamp}-${randomStr}`;

    try {
      const response = await axios.post<UserResponse>(
        `${this.config.apiUrl}/v1/users/batch`,
        {
          bypassEmailConfirmation: true,
          usersList: [{
            email: email,
            firstName: "Ethora Bot",
            lastName: "Test",
            password: "testbot123",
            uuid: uuid
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-custom-token': `Bearer ${this.createServerToken()}`,
            'x-app-id': this.config.appId
          }
        }
      );

      // The response format will be different for batch creation
      const createdUser = response.data.results[0];
      this.botUser = {
        id: createdUser._id,
        password: createdUser.xmppPassword,
        walletAddress: createdUser.defaultWallet.walletAddress,
        accessToken: createdUser.token
      };
      this.logger.info('Bot user created successfully', { user: this.botUser });
    } catch (error) {
      this.logger.error('Failed to create bot user', { error });
      throw error;
    }
  }

  getBotUser() {
    return this.botUser;
  }

  /**
   * Retrieves list of available chat rooms
   */
  async listRooms(): Promise<RoomListResponse['items']> {
    try {
      this.logger.info('Retrieving list of available rooms...');
      const response = await axios.get<RoomListResponse>(`${this.config.apiUrl}/v1/chat/rooms`, {
        headers: { 
          'Authorization': this.botUser?.accessToken || '',
          'x-app-id': this.config.appId
        }
      });

      this.logger.info('Retrieved room list', { 
        roomCount: response.data.items.length,
        rooms: response.data.items.map(r => ({ name: r.name, jid: r.jid }))
      });
      
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to retrieve room list', { error });
      throw error;
    }
  }

  /**
   * Joins a chat room
   * @param roomJid Room JID to join
   */
  async joinRoom(roomJid: string): Promise<void> {
    if (!this.botUser) {
      throw new Error('Bot user not created yet');
    }

    try {
      this.logger.info('Joining room...', { roomJid });
      await axios.post(`${this.config.apiUrl}/v1/chat/room/join`, {
        userId: this.botUser.id,
        roomJid
      }, {
        headers: { 
          'Authorization': this.botUser.accessToken,
          'x-app-id': this.config.appId
        }
      });

      this.roomJid = roomJid;
      this.logger.info('Successfully joined room', { roomJid });
    } catch (error) {
      this.logger.error('Failed to join room', { error, roomJid });
      throw error;
    }
  }

  /**
   * Creates a new chat room for testing
   * @param userId Creator's user ID
   * @returns Room JID
   */
  async createRoom(userId: string): Promise<string> {
    try {
      const response = await axios.post<RoomResponse>(`${this.config.apiUrl}/v1/chat/room`, {
        name: 'Test Room',
        description: 'Room for automated testing',
        userId,
        isPrivate: false
      }, {
        headers: { 
          'Authorization': this.botUser?.accessToken || '',
          'x-app-id': this.config.appId
        }
      });

      this.logger.info('Created new test room', { roomJid: response.data.jid });
      return response.data.jid;
    } catch (error) {
      this.logger.error('Failed to create test room', { error });
      throw error;
    }
  }

  /**
   * Sends a message to the test room
   * @param userId Sender's user ID
   * @param message Message content
   * @param quotedMessageId Optional message ID to quote
   */
  async sendMessage(userId: string, message: string, quotedMessageId?: string): Promise<void> {
    try {
      const payload: any = {
        roomJid: this.roomJid,
        userId,
        body: message
      };

      if (quotedMessageId) {
        payload.quotedMessageId = quotedMessageId;
      }

      const response = await axios.post<MessageResponse>(`${this.config.apiUrl}/v1/chat/message`, payload, {
        headers: { 
          'Authorization': this.botUser?.accessToken || '',
          'x-app-id': this.config.appId
        }
      });

      this.lastMessageId = response.data.id;
      this.logger.info('Sent test message', { messageId: response.data.id });
    } catch (error) {
      this.logger.error('Failed to send message', { error });
      throw error;
    }
  }

  /**
   * Sends a file attachment to the test room
   * @param userId Sender's user ID
   * @param fileUrl URL of the file to send
   */
  async sendFileAttachment(userId: string, fileUrl: string): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', fileUrl);
      formData.append('roomJid', this.roomJid);
      formData.append('userId', userId);

      await axios.post(`${this.config.apiUrl}/v1/chat/attachment`, formData, {
        headers: {
          'Authorization': this.botUser?.accessToken || '',
          'x-app-id': this.config.appId
        }
      });

      this.logger.info('Sent file attachment');
    } catch (error) {
      this.logger.error('Failed to send file attachment', { error });
      throw error;
    }
  }

  /**
   * Retrieves user profile information
   * @param userId User ID to look up
   */
  async getUserProfile(userId: string): Promise<void> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/v1/users/${userId}`, {
        headers: { 
          'Authorization': this.botUser?.accessToken || '',
          'x-app-id': this.config.appId
        }
      });

      this.logger.info('Retrieved user profile', { profile: response.data });
    } catch (error) {
      this.logger.error('Failed to get user profile', { error });
      throw error;
    }
  }

  /**
   * Runs all test scenarios in sequence
   */
  async runTests(): Promise<void> {
    try {
      this.logger.info('Starting test scenarios...');

      // Step 1: Create bot user
      await this.createBotUser();
      if (!this.botUser) {
        throw new Error('Failed to create bot user');
      }

      // Step 2: Create or join room
      if (this.config.createNewRoom) {
        await this.createRoom(this.botUser.id);
      } else {
        await this.listRooms();
      }

      // Step 3: Send test messages
      await this.sendMessage(this.botUser.id, 'Hello! I am a test bot 🤖');
      await new Promise(resolve => setTimeout(resolve, this.config.messageWaitTime));

      // Step 4: Send file attachment
      await this.sendFileAttachment(this.botUser.id, this.config.testFileUrl);
      await new Promise(resolve => setTimeout(resolve, this.config.messageWaitTime));

      this.logger.info('All test scenarios completed successfully');
    } catch (error) {
      this.logger.error('Test scenarios failed', { error });
      throw error;
    }
  }
}
