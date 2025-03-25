import axios from 'axios';
import inquirer from 'inquirer';
import { TestBotConfig, config } from './config';
import { Logger } from 'winston';
import { logger } from './logger';
import jwt from 'jsonwebtoken';

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

interface TestUser {
  _id: string;
  username: string;
  walletAddress: string;
  accessToken?: string;
}

interface TestRoom {
  _id: string;
  jid: string;
  title: string;
  participants: string[];
}

interface ApiResponse<T> {
  data: T;
}

export class TestBotCleanup {
  private config: TestBotConfig;
  private logger: Logger;
  private cleanupUser?: TestUser;

  constructor(config: TestBotConfig) {
    this.config = config;
    this.logger = logger;
  }

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
   * Runs the cleanup process
   */
  public async run(): Promise<void> {
    try {
      this.logger.info('Starting cleanup process...');

      // Create server token
      const serverToken = await this.createServerToken();

      // Create a temporary user for cleanup
      await this.createCleanupUser(serverToken);

      // Find test users and rooms
      const testUsers = await this.findTestUsers();
      const testRooms = await this.findTestRooms(serverToken);

      // Log findings
      this.logger.info('Found test data:', {
        users: testUsers.length,
        rooms: testRooms.length
      });

      if (testUsers.length === 0 && testRooms.length === 0) {
        this.logger.info('No test data found to clean up');
        return;
      }

      // Display findings
      console.log('\nTest Users Found:');
      testUsers.forEach(user => {
        console.log(`- ${user.username} (${user._id})`);
      });

      console.log('\nTest Rooms Found:');
      testRooms.forEach(room => {
        console.log(`- ${room.title} (${room.jid})`);
      });

      // Ask for confirmation
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `\nFound ${testUsers.length} test users and ${testRooms.length} test rooms. Proceed with deletion?`,
          default: false
        }
      ]);

      if (!proceed) {
        this.logger.info('Cleanup cancelled by user');
        return;
      }

      // Delete test data
      await this.deleteTestData(testUsers, testRooms, serverToken);

      // Delete cleanup user
      await this.deleteCleanupUser(serverToken);

      this.logger.info('Cleanup completed successfully');
    } catch (error) {
      this.logger.error('Cleanup failed', { error });
      throw error;
    }
  }

  /**
   * Creates a temporary user for cleanup operations
   */
  private async createCleanupUser(serverToken: string): Promise<void> {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const username = `ethora.cleanup.bot.${timestamp}.${randomId}@ethora.bot`;
      const uuid = `cleanupbot-${timestamp}-${randomId}`;

      this.logger.info('Generated cleanup user details:', {
        apiUrl: this.config.apiUrl,
        appId: this.config.appId,
        email: username,
        uuid
      });

      const requestBody = {
        bypassEmailConfirmation: true,
        usersList: [{
          email: username,
          firstName: 'Cleanup',
          lastName: 'Bot',
          password: 'cleanup123',
          uuid
        }]
      };

      this.logger.info('Sending user creation request', { requestBody });

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
        this.cleanupUser = {
          _id: user._id,
          username,
          walletAddress: user.defaultWallet.walletAddress,
          accessToken: serverToken
        };
        this.logger.info('Created cleanup user', { userId: this.cleanupUser._id });
      } else {
        throw new Error('Failed to create cleanup user');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to create cleanup user', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to create cleanup user', { 
          error: error.message 
        });
      } else {
        this.logger.error('Failed to create cleanup user', { 
          error: String(error) 
        });
      }
      throw error;
    }
  }

  /**
   * Deletes the cleanup user
   */
  private async deleteCleanupUser(serverToken: string): Promise<void> {
    if (!this.cleanupUser) {
      return;
    }

    try {
      await axios.delete(
        `${this.config.apiUrl}/v1/users/${this.cleanupUser._id}`,
        {
          headers: {
            'x-custom-token': `Bearer ${serverToken}`,
            'Content-Type': 'application/json',
            'x-app-id': this.config.appId
          }
        }
      );
      this.logger.info('Deleted cleanup user', { userId: this.cleanupUser._id });
    } catch (error) {
      this.logger.error('Failed to delete cleanup user', { userId: this.cleanupUser._id, error });
    }
  }

  /**
   * Finds all test users created by the bot
   */
  private async findTestUsers(): Promise<TestUser[]> {
    try {
      interface UsersResponse {
        ok: boolean;
        items: Array<{
          _id: string;
          email: string;
          defaultWallet?: {
            walletAddress: string;
          };
        }>;
      }

      const serverToken = await this.createServerToken();
      this.logger.info('Fetching users with server token', { serverToken });

      const response = await axios.get<UsersResponse>(
        `${this.config.apiUrl}/v1/users/${this.config.appId}`,
        {
          params: {
            limit: 50
          },
          headers: {
            'x-custom-token': `Bearer ${serverToken}`,
            'Content-Type': 'application/json',
            'x-app-id': this.config.appId
          }
        }
      );

      this.logger.info('Received users response', { 
        status: response.status, 
        statusText: response.statusText,
        data: response.data 
      });

      if (response.data.items) {
        // Filter users that match our test pattern
        return response.data.items
          .filter(user => 
            user.email.startsWith('ethora.test.bot.') && 
            user.email.endsWith('@ethora.bot')
          )
          .map(user => ({
            _id: user._id,
            username: user.email,
            walletAddress: user.defaultWallet?.walletAddress || 'no-wallet'
          }));
      }
      throw new Error('Failed to fetch users');
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; statusText: string; data: any }; message: string };
        this.logger.error('Failed to fetch test users', {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data,
          error: axiosError.message
        });
      } else if (error instanceof Error) {
        this.logger.error('Failed to fetch test users', { 
          error: error.message 
        });
      } else {
        this.logger.error('Failed to fetch test users', { 
          error: String(error) 
        });
      }
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Finds all test rooms created by the bot
   */
  private async findTestRooms(serverToken: string): Promise<TestRoom[]> {
    try {
      interface RoomsResponse {
        ok: boolean;
        items: Array<{
          _id: string;
          jid: string;
          name: string;
          participants: string[];
        }>;
      }

      const response = await axios.get<RoomsResponse>(
        `${this.config.apiUrl}/v1/rooms`,
        {
          headers: {
            'x-custom-token': `Bearer ${serverToken}`,
            'Content-Type': 'application/json',
            'x-app-id': this.config.appId
          }
        }
      );

      if (!response.data.ok) {
        throw new Error('Failed to fetch rooms');
      }

      // Filter rooms that match our test pattern
      return response.data.items
        .filter(room => 
          room.name.startsWith('ethora.test.room.') || 
          room.name.startsWith('ethora.test.bot.')
        )
        .map(room => ({
          _id: room._id,
          jid: room.jid,
          title: room.name,
          participants: room.participants
        }));
    } catch (error) {
      this.logger.error('Failed to fetch test rooms', { error });
      throw error;
    }
  }

  /**
   * Deletes test users and rooms
   */
  private async deleteTestData(users: TestUser[], rooms: TestRoom[], serverToken: string): Promise<void> {
    // Delete rooms first
    for (const room of rooms) {
      try {
        await axios.delete(
          `${this.config.apiUrl}/v1/rooms/${room._id}`,
          {
            headers: {
              'x-custom-token': `Bearer ${serverToken}`,
              'Content-Type': 'application/json',
              'x-app-id': this.config.appId
            }
          }
        );
        this.logger.info('Deleted test room', { roomId: room._id, roomTitle: room.title });
      } catch (error) {
        this.logger.error('Failed to delete test room', { roomId: room._id, error });
      }
    }

    // Delete users
    for (const user of users) {
      try {
        await axios.delete(
          `${this.config.apiUrl}/v1/users/${user._id}`,
          {
            headers: {
              'x-custom-token': `Bearer ${serverToken}`,
              'Content-Type': 'application/json',
              'x-app-id': this.config.appId
            }
          }
        );
        this.logger.info('Deleted test user', { userId: user._id, username: user.username });
      } catch (error) {
        this.logger.error('Failed to delete test user', { userId: user._id, error });
      }
    }
  }
}

async function main() {
  const cleanup = new TestBotCleanup(config);
  await cleanup.run();
}

main(); 