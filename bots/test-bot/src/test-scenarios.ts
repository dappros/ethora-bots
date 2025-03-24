import { client as xmppClient, Client } from '@xmpp/client';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { TestBotConfig } from './config';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { BotUser, RoomListResponse } from './types';

interface UserResponse {
  ok: boolean;
  results: Array<{
    _id: string;
    defaultWallet: {
      walletAddress: string;
    };
    xmppPassword: string;
  }>;
}

interface RoomResponse {
  jid: string;
  name: string;
  description: string;
}

interface MessageResponse {
  ok: boolean;
  result: {
    _id: string;
  };
}

export class TestScenarios {
  private botUser: BotUser | null = null;
  private client: Client | null = null;
  private roomJid: string | null = null;

  constructor(
    private readonly config: TestBotConfig,
    private readonly logger: Logger
  ) {}

  /**
   * Creates a server token for b2b authentication
   */
  private async createServerToken(): Promise<string> {
    const payload = {
      data: {
        appId: this.config.appId,
        type: 'server'
      }
    };

    return jwt.sign(payload, this.config.appToken, {
      algorithm: 'HS256'
    });
  }

  /**
   * Runs all test scenarios
   */
  async run(): Promise<void> {
    try {
      this.logger.info('Starting test scenarios...', { config: this.config });

      // Step 1: Create bot user
      await this.createBotUser();

      // Step 2: Initialize XMPP client
      if (this.botUser) {
        await this.initializeXmppClient();
      }

      // Step 3: Create or join room
      if (this.config.createNewRoom) {
        await this.createRoom();
      } else if (this.config.existingRoomJid) {
        this.roomJid = this.config.existingRoomJid;
        await this.joinRoom(this.config.existingRoomJid);
      } else {
        const rooms = await this.listRooms();
        if (rooms.length > 0) {
          this.roomJid = rooms[0].jid;
          await this.joinRoom(rooms[0].jid);
        } else {
          throw new Error('No rooms available');
        }
      }

      // Step 4: Send test messages
      if (this.roomJid) {
        await this.sendMessage('Hello! I am a test bot 🤖');
        await new Promise(resolve => setTimeout(resolve, this.config.messageWaitTime));
      }

    } catch (error) {
      this.logger.error('Test scenarios failed', { error });
      throw error;
    }
  }

  /**
   * Creates a new bot user account
   */
  private async createBotUser(): Promise<void> {
    this.logger.info('Creating bot user account...');

    // Generate unique bot user details
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const email = `ethora.test.bot.${timestamp}.${randomId}@ethora.bot`;
    const uuid = `testbot-${timestamp}-${randomId}`;

    this.logger.info('Generated bot user details:', {
      apiUrl: this.config.apiUrl,
      appId: this.config.appId,
      email,
      uuid
    });

    try {
      // Send user creation request
      const requestBody = {
        bypassEmailConfirmation: true,
        usersList: [{
          email,
          firstName: 'Ethora Bot',
          lastName: 'Test',
          password: 'testbot123',
          uuid
        }]
      };

      this.logger.info('Sending user creation request', { requestBody });

      const serverToken = await this.createServerToken();
      this.logger.info('Generated server token', { serverToken });

      const response = await axios.post<UserResponse>(
        `${this.config.apiUrl}/v1/users/batch`,
        requestBody,
        {
          headers: {
            'x-custom-token': `Bearer ${serverToken}`,
            'Content-Type': 'application/json',
            'x-app-id': this.config.appId
          }
        }
      );

      this.logger.info('Received user creation response', { data: response.data, status: response.status, statusText: response.statusText });

      if (response.data.ok && response.data.results.length > 0) {
        const user = response.data.results[0];
        this.botUser = {
          id: user._id,
          xmppPassword: user.xmppPassword,
          walletAddress: user.defaultWallet.walletAddress,
          accessToken: this.config.appToken
        };

        this.logger.info('Bot user created successfully', {
          userId: this.botUser.id,
          walletAddress: this.botUser.walletAddress,
          xmppPassword: this.botUser.xmppPassword
        });
      } else {
        throw new Error('Failed to create bot user');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to create bot user', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to create bot user', { 
          error: error.message 
        });
      } else {
        this.logger.error('Failed to create bot user', { 
          error: String(error) 
        });
      }
      throw error;
    }
  }

  /**
   * Initializes the XMPP client with the bot user credentials
   */
  private async initializeXmppClient(): Promise<void> {
    if (!this.botUser) {
      throw new Error('Bot user not created yet');
    }

    try {
      this.logger.info('Initializing XMPP client', {
        domain: this.config.xmppDomain,
        resource: 'test-bot',
        service: this.config.xmppEndpoint,
        username: `${this.botUser.id}@${this.config.xmppDomain}`
      });

      this.client = xmppClient({
        service: this.config.xmppEndpoint,
        domain: this.config.xmppDomain,
        resource: 'test-bot',
        username: `${this.botUser.id}@${this.config.xmppDomain}`,
        password: this.botUser.xmppPassword
      });

      // Set up event handlers
      this.client.on('error', (err: Error) => {
        this.logger.error('XMPP client error', { error: err });
      });

      this.client.on('online', (jid: string) => {
        this.logger.info('XMPP client connected', { jid });
      });

      // Start the client
      await this.client.start();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to initialize XMPP client', { error: error.stack });
      } else {
        this.logger.error('Failed to initialize XMPP client', { error });
      }
      throw error;
    }
  }

  /**
   * Lists available chat rooms
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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to retrieve room list', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to retrieve room list', { 
          error: error.message 
        });
      } else {
        this.logger.error('Failed to retrieve room list', { 
          error: String(error) 
        });
      }
      throw error;
    }
  }

  /**
   * Creates a new chat room
   */
  private async createRoom(): Promise<void> {
    if (!this.botUser) {
      throw new Error('Bot user not created yet');
    }

    try {
      const roomName = `Test Room ${uuidv4()}`;
      this.logger.info('Creating new room...', { roomName });

      const response = await axios.post<RoomResponse>(
        `${this.config.apiUrl}/v1/chat/room`,
        {
          name: roomName,
          description: 'A test room created by the test bot',
          userId: this.botUser.id
        },
        {
          headers: {
            'Authorization': this.botUser.accessToken,
            'x-app-id': this.config.appId
          }
        }
      );

      this.roomJid = response.data.jid;
      this.logger.info('Room created successfully', { roomJid: this.roomJid });

      // Join the newly created room
      if (this.roomJid) {
        await this.joinRoom(this.roomJid);
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to create room', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to create room', { 
          error: error.message 
        });
      } else {
        this.logger.error('Failed to create room', { 
          error: String(error) 
        });
      }
      throw error;
    }
  }

  /**
   * Joins an existing chat room
   */
  private async joinRoom(roomJid: string): Promise<void> {
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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to join room', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message,
          roomJid
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to join room', { 
          error: error.message,
          roomJid
        });
      } else {
        this.logger.error('Failed to join room', { 
          error: String(error),
          roomJid
        });
      }
      throw error;
    }
  }

  /**
   * Sends a message to the current room
   */
  private async sendMessage(message: string): Promise<void> {
    if (!this.botUser || !this.roomJid) {
      throw new Error('Bot user or room not initialized');
    }

    try {
      this.logger.info('Sending message...', { message });
      await axios.post<MessageResponse>(
        `${this.config.apiUrl}/v1/chat/message`,
        {
          userId: this.botUser.id,
          roomJid: this.roomJid,
          message
        },
        {
          headers: {
            'Authorization': this.botUser.accessToken,
            'x-app-id': this.config.appId
          }
        }
      );

      this.logger.info('Message sent successfully', { message });
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to send message', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message,
          message
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to send message', { 
          error: error.message,
          message
        });
      } else {
        this.logger.error('Failed to send message', { 
          error: String(error),
          message
        });
      }
      throw error;
    }
  }
}
