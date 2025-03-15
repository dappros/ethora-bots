import axios from 'axios';
import FormData from 'form-data';
import { TestConfig } from './config';
import { Logger } from 'winston';

interface UserResponse {
  user: {
    id: string;
    xmppPassword: string;
    walletAddress: string;
  };
}

interface BotUser {
  id: string;
  password: string;
  walletAddress: string;
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
   * Creates a bot user account
   */
  async createBotUser(): Promise<void> {
    this.logger.info('Creating bot user account...');

    const email = `${this.config.botName.toLowerCase().replace(/\s+/g, '.')}@ethora.bot`;
    const [firstName, ...lastNameParts] = this.config.botName.split(' ');
    const lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : 'Bot';

    try {
      const response = await axios.post<UserResponse>(
        `${this.config.apiUrl}/v1/users/sign-up-with-email`,
        {
          email,
          firstName,
          lastName
        },
        {
          headers: {
            'Authorization': this.config.appToken,
            'x-app-id': this.config.appId
          }
        }
      );

      this.botUser = {
        id: response.data.user.id,
        password: response.data.user.xmppPassword,
        walletAddress: response.data.user.walletAddress
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
          'x-custom-token': this.config.appToken,
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
          'x-custom-token': this.config.appToken,
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
          'x-custom-token': this.config.appToken,
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
          'x-custom-token': this.config.appToken,
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
          'x-custom-token': this.config.appToken,
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
          'x-custom-token': this.config.appToken,
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
