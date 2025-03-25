import { client as xmppClient, Client } from '@xmpp/client';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { TestBotConfig } from './config';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { BotUser, RoomListResponse } from './types';
import xml = require('@xmpp/xml');

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

      // Step 4: Run chat room tests
      await this.runChatRoomTests();

      this.logger.info('All test scenarios completed successfully');
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
        username: `${this.config.appId}_${this.botUser.id}`
      });

      this.client = xmppClient({
        service: this.config.xmppEndpoint,
        domain: this.config.xmppDomain,
        resource: 'test-bot',
        username: `${this.config.appId}_${this.botUser.id}`,
        password: this.botUser.xmppPassword
      });

      // Set up event handlers
      this.client.on('error', (err: Error) => {
        this.logger.error('XMPP client error', { 
          error: err,
          errorMessage: err.message,
          errorStack: err.stack,
          errorName: err.name
        });
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

      const serverToken = await this.createServerToken();
      this.logger.info('Generated server token for room creation', { serverToken });

      const response = await axios.post<RoomResponse>(
        `${this.config.apiUrl}/v1/chats`,
        {
          title: roomName,
          description: 'A test room created by the test bot',
          type: 'public'
        },
        {
          headers: {
            'x-custom-token': `Bearer ${serverToken}`,
            'Content-Type': 'application/json',
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
   * Runs chat room tests
   */
  private async runChatRoomTests(): Promise<void> {
    if (!this.roomJid) {
      throw new Error('No room joined yet');
    }

    try {
      // Test 1: Send basic text message
      this.logger.info('Testing: Send basic text message');
      await this.sendMessage('Hello, this is a test message from the bot! 👋');

      // Test 2: Send message with mentions
      this.logger.info('Testing: Send message with mentions');
      await this.sendMessage('Hello @all! This is a message with mentions.');

      // Test 3: Send message with links
      this.logger.info('Testing: Send message with links');
      await this.sendMessage('Check out our website: https://ethora.com');

      // Test 4: Send image attachment
      this.logger.info('Testing: Send image attachment');
      await this.sendFileAttachment('image', 'test-image.jpg');

      // Test 5: Send document attachment
      this.logger.info('Testing: Send document attachment');
      await this.sendFileAttachment('document', 'test-document.pdf');

      // Test 6: Send message and test reactions
      this.logger.info('Testing: Message reactions');
      const messageId = await this.sendMessage('This message will be reacted to');
      await this.reactToMessage(messageId, '👍');
      await this.reactToMessage(messageId, '❤️');

      // Test 7: Send message and edit it
      this.logger.info('Testing: Message editing');
      const messageToEdit = await this.sendMessage('This message will be edited');
      await this.editMessage(messageToEdit, 'This message has been edited');

      // Test 8: Send message and reply to it
      this.logger.info('Testing: Message replies');
      const messageToReplyTo = await this.sendMessage('This message will be replied to');
      await this.replyToMessage(messageToReplyTo, 'This is a reply to the message');

      // Test 9: Send message and delete it
      this.logger.info('Testing: Message deletion');
      const messageToDelete = await this.sendMessage('This message will be deleted');
      await this.deleteMessage(messageToDelete);

      // Test 10: Get room participants
      this.logger.info('Testing: Get room participants');
      const participants = await this.getRoomParticipants();
      this.logger.info('Room participants:', { participants });

      // Test 11: Get room info
      this.logger.info('Testing: Get room info');
      const roomInfo = await this.getRoomInfo();
      this.logger.info('Room info:', { roomInfo });

      // Test 12: Update room settings
      this.logger.info('Testing: Update room settings');
      await this.updateRoomSettings({
        title: 'Updated Test Room',
        description: 'This room has been updated by the test bot'
      });

      // Test 13: Leave and rejoin room
      this.logger.info('Testing: Leave and rejoin room');
      await this.leaveRoom();
      await this.joinRoom(this.roomJid);

      this.logger.info('All chat room tests completed successfully');
    } catch (error) {
      this.logger.error('Chat room tests failed', { error });
      throw error;
    }
  }

  /**
   * Sends a message to the current room and returns its ID
   */
  private async sendMessage(content: string): Promise<string> {
    if (!this.client || !this.roomJid) {
      throw new Error('XMPP client not initialized or no room joined');
    }

    const messageId = uuidv4();
    const message = xml(
      'message',
      {
        to: this.roomJid,
        type: 'groupchat',
        id: messageId
      },
      xml('body', {}, content)
    );

    await this.client.send(message);
    this.logger.info('Message sent successfully', { content, messageId });
    return messageId;
  }

  private async sendFileAttachment(type: 'image' | 'document' | 'audio' | 'video', filename: string): Promise<void> {
    if (!this.roomJid) {
      throw new Error('No room joined');
    }

    // Download test file from the configured URL
    const response = await axios.get(this.config.testFileUrl, { responseType: 'arraybuffer' });
    const fileData = response.data as ArrayBuffer;

    // Create file upload request
    const formData = new FormData();
    formData.append('file', new Blob([fileData]), filename);
    formData.append('type', type);

    // Upload file
    const uploadResponse = await axios.post<{ url: string }>(
      `${this.config.apiUrl}/v1/files/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${await this.createServerToken()}`,
          'Content-Type': 'multipart/form-data',
          'x-app-id': this.config.appId
        }
      }
    );

    // Send message with file attachment
    await this.sendMessage(`Here's a ${type} attachment: ${uploadResponse.data.url}`);
  }

  /**
   * Reacts to a message with an emoji
   */
  private async reactToMessage(messageId: string, reaction: string): Promise<void> {
    if (!this.client || !this.roomJid) {
      throw new Error('XMPP client not initialized or no room joined');
    }

    const reactionMessage = xml(
      'message',
      {
        to: this.roomJid,
        type: 'groupchat',
        id: uuidv4()
      },
      xml('reaction', {
        messageId,
        reaction
      })
    );

    await this.client.send(reactionMessage);
    this.logger.info('Message reaction sent successfully', { messageId, reaction });
  }

  /**
   * Edits a message
   */
  private async editMessage(messageId: string, newContent: string): Promise<void> {
    if (!this.client || !this.roomJid) {
      throw new Error('XMPP client not initialized or no room joined');
    }

    const editMessage = xml(
      'message',
      {
        to: this.roomJid,
        type: 'groupchat',
        id: uuidv4()
      },
      xml('edit', {
        messageId
      }),
      xml('body', {}, newContent)
    );

    await this.client.send(editMessage);
    this.logger.info('Message edited successfully', { messageId, newContent });
  }

  /**
   * Replies to a message
   */
  private async replyToMessage(messageId: string, replyContent: string): Promise<void> {
    if (!this.client || !this.roomJid) {
      throw new Error('XMPP client not initialized or no room joined');
    }

    const replyMessage = xml(
      'message',
      {
        to: this.roomJid,
        type: 'groupchat',
        id: uuidv4()
      },
      xml('reply', {
        messageId
      }),
      xml('body', {}, replyContent)
    );

    await this.client.send(replyMessage);
    this.logger.info('Message reply sent successfully', { messageId, replyContent });
  }

  /**
   * Deletes a message
   */
  private async deleteMessage(messageId: string): Promise<void> {
    if (!this.client || !this.roomJid) {
      throw new Error('XMPP client not initialized or no room joined');
    }

    const deleteMessage = xml(
      'message',
      {
        to: this.roomJid,
        type: 'groupchat',
        id: uuidv4()
      },
      xml('delete', {
        messageId
      })
    );

    await this.client.send(deleteMessage);
    this.logger.info('Message deleted successfully', { messageId });
  }

  private async getRoomParticipants(): Promise<string[]> {
    if (!this.roomJid) {
      throw new Error('No room joined');
    }

    const response = await axios.get<{ participants: string[] }>(
      `${this.config.apiUrl}/v1/chats/${this.roomJid}/participants`,
      {
        headers: {
          'Authorization': `Bearer ${await this.createServerToken()}`,
          'x-app-id': this.config.appId
        }
      }
    );

    return response.data.participants;
  }

  private async getRoomInfo(): Promise<any> {
    if (!this.roomJid) {
      throw new Error('No room joined');
    }

    const response = await axios.get(
      `${this.config.apiUrl}/v1/chats/${this.roomJid}`,
      {
        headers: {
          'Authorization': `Bearer ${await this.createServerToken()}`,
          'x-app-id': this.config.appId
        }
      }
    );

    return response.data;
  }

  private async updateRoomSettings(settings: { title?: string; description?: string }): Promise<void> {
    if (!this.roomJid) {
      throw new Error('No room joined');
    }

    await axios.patch(
      `${this.config.apiUrl}/v1/chats/${this.roomJid}`,
      settings,
      {
        headers: {
          'Authorization': `Bearer ${await this.createServerToken()}`,
          'Content-Type': 'application/json',
          'x-app-id': this.config.appId
        }
      }
    );
  }

  private async leaveRoom(): Promise<void> {
    if (!this.client || !this.roomJid) {
      throw new Error('XMPP client not initialized or no room joined');
    }

    const localJid = this.client.jid?.getLocal();
    if (!localJid) {
      throw new Error('Could not get local JID');
    }

    const presence = xml(
      'presence',
      {
        to: `${this.roomJid}/${localJid}`,
        type: 'unavailable'
      }
    );

    await this.client.send(presence);
    this.logger.info('Left room successfully', { roomJid: this.roomJid });
  }
}
