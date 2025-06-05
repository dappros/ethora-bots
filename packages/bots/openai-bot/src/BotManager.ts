import { BotInstance, BotConfig } from './BotInstance';
import * as fs from 'fs/promises';
import * as path from 'path';

export class BotManager {
  private instances: Map<string, BotInstance> = new Map();
  private openAIApiKey: string;

  constructor(openAIApiKey: string) {
    this.openAIApiKey = openAIApiKey;
  }

  /**
   * Load bot configurations from a JSON file
   */
  async loadFromFile(configPath: string): Promise<void> {
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const configs: BotConfig[] = JSON.parse(data);
      
      console.log(`Loading ${configs.length} bot configurations from ${configPath}`);
      
      for (const config of configs) {
        await this.createInstance(config);
      }
    } catch (error) {
      console.error('Error loading bot configurations:', error);
      throw error;
    }
  }

  /**
   * Create a new bot instance
   */
  async createInstance(config: BotConfig): Promise<BotInstance> {
    if (this.instances.has(config.id)) {
      throw new Error(`Bot instance with ID ${config.id} already exists`);
    }

    console.log(`Creating bot instance: ${config.id}`);
    const instance = new BotInstance(config, this.openAIApiKey);
    
    this.instances.set(config.id, instance);
    
    try {
      await instance.start();
      return instance;
    } catch (error) {
      // Remove instance if start fails
      this.instances.delete(config.id);
      throw error;
    }
  }

  /**
   * Remove a bot instance
   */
  async removeInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Bot instance with ID ${instanceId} not found`);
    }

    console.log(`Removing bot instance: ${instanceId}`);
    await instance.stop();
    this.instances.delete(instanceId);
  }

  /**
   * Get a bot instance by ID
   */
  getInstance(instanceId: string): BotInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get all bot instances
   */
  getAllInstances(): BotInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get all active bot instances
   */
  getActiveInstances(): BotInstance[] {
    return this.getAllInstances().filter(instance => instance.isActive());
  }

  /**
   * Stop all bot instances
   */
  async stopAll(): Promise<void> {
    console.log('Stopping all bot instances...');
    const stopPromises = Array.from(this.instances.values()).map(instance => 
      instance.stop().catch(error => 
        console.error(`Error stopping instance ${instance.getId()}:`, error)
      )
    );
    
    await Promise.all(stopPromises);
    this.instances.clear();
    console.log('All bot instances stopped');
  }

  /**
   * Get status of all instances
   */
  getStatus(): { id: string; active: boolean; config: BotConfig }[] {
    return this.getAllInstances().map(instance => ({
      id: instance.getId(),
      active: instance.isActive(),
      config: instance.getConfig()
    }));
  }
}