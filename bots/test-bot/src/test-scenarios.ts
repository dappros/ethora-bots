import axios from 'axios';
import FormData from 'form-data';
import { TestConfig } from './config';
import { Logger } from 'winston';

interface UserResponse {
  id: string;
  xmppPassword: string;
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
  private botUser: { id: string; password: string; walletAddress: string; } | null = null;
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
    try {
      this.logger.info('Creating bot user account...');
      const response = await axios.post<UserResponse>(`${this.config.apiUrl}/v1/users`, {
        appId: this.config.appId,
        name: this.config.botName
      }, {
        headers: { 
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
        }
      });

      this.botUser = {
        id: response.data.id,
        password: response.data.xmppPassword,
        walletAddress: response.data.walletAddress
      };
      
      this.logger.info('Bot user created successfully', { 
        userId: this.botUser.id,
        walletAddress: this.botUser.walletAddress 
      });
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
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
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
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
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
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
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
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
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
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
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
          'Authorization': 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InBhcmVudEFwcElkIjpudWxsLCJpc0FsbG93ZWROZXdBcHBDcmVhdGUiOnRydWUsImlzQmFzZUFwcCI6dHJ1ZSwiZ29vZ2xlU2VydmljZXNKc29uIjoiIiwiZ29vZ2xlU2VydmljZUluZm9QbGlzdCI6IiIsIlJFQUNUX0FQUF9TVFJJUEVfUFVCTElTSEFCTEVfS0VZIjoiIiwiUkVBQ1RfQVBQX1NUUklQRV9TRUNSRVRfS0VZIjoiIiwic3RhdHMiOnsidG90YWxSZWdpc3RlcmVkIjowLCJyZWNlbnRseVJlZ2lzdGVyZWQiOjAsInRvdGFsU2Vzc2lvbnMiOjAsInJlY2VudGx5U2Vzc2lvbnMiOjAsInRvdGFsQXBpQ2FsbHMiOjAsInJlY2VudGx5QXBpQ2FsbHMiOjAsInRvdGFsRmlsZXMiOjAsInJlY2VudGx5RmlsZXMiOjAsInRvdGFsVHJhbnNhY3Rpb25zIjowLCJyZWNlbnRseVRyYW5zYWN0aW9ucyI6MCwidG90YWxJc3N1YW5jZSI6MCwicmVjZW50bHlJc3N1YW5jZSI6MH0sInNpZ25vbk9wdGlvbnMiOltdLCJhZnRlckxvZ2luUGFnZSI6ImNoYXRzIiwiYWxsb3dVc2Vyc1RvQ3JlYXRlUm9vbXMiOnRydWUsIl9pZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYiIsImRlZmF1bHRSb29tcyI6W10sImRpc3BsYXlOYW1lIjoiRXRob3JhIiwiZG9tYWluTmFtZSI6ImV0aG9yYSIsImNyZWF0b3JJZCI6IjY3ZDNjYzQ1YjUwMThiOTg3MmMxNmEwYyIsInVzZXJzQ2FuRnJlZSI6dHJ1ZSwiZGVmYXVsdEFjY2Vzc0Fzc2V0c09wZW4iOnRydWUsImRlZmF1bHRBY2Nlc3NQcm9maWxlT3BlbiI6dHJ1ZSwiYnVuZGxlSWQiOiJjb20uZXRob3JhIiwicHJpbWFyeUNvbG9yIjoiIzAwM0U5QyIsImNvaW5TeW1ib2wiOiJFVE8iLCJjb2luTmFtZSI6IkV0aG9yYSBDb2luIn0sImlhdCI6MTc0MTkzMzY0MX0.UOp3rIVxXMrJHnfpzlzJLE73LoaA3EHl7CfOy6uo8ps'
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
  async runAllTests(): Promise<void> {
    try {
      this.logger.info('Starting test scenarios...');

      // Step 1: Create bot user
      await this.createBotUser();
      if (!this.botUser) {
        throw new Error('Failed to create bot user');
      }

      // Step 2: List available rooms
      const rooms = await this.listRooms();
      if (rooms.length === 0) {
        this.logger.warn('No rooms available, creating a new one...');
        this.roomJid = await this.createRoom(this.botUser.id);
      } else {
        // Join the first available room
        await this.joinRoom(rooms[0].jid);
      }

      // Step 3: Send test messages
      await this.sendMessage(this.botUser.id, 'Hello! I am a test bot 🤖');
      await new Promise(resolve => setTimeout(resolve, this.config.messageWaitTime));

      // Step 4: Send a file attachment
      await this.sendFileAttachment(this.botUser.id, this.config.testFileUrl);

      this.logger.info('All test scenarios completed successfully');
    } catch (error) {
      this.logger.error('Test scenarios failed', { error });
      throw error;
    }
  }
}
