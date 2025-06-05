import { Message } from './OpenAIService';

interface ConversationEntry {
  timestamp: Date;
  message: Message;
}

export class MemoryService {
  private conversations: Map<string, ConversationEntry[]> = new Map();
  private maxMessagesPerUser = 100;

  /**
   * Add a message to the conversation history
   */
  async addMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const conversation = this.conversations.get(userId)!;
    conversation.push({
      timestamp: new Date(),
      message: { role, content }
    });

    // Limit conversation history size
    if (conversation.length > this.maxMessagesPerUser) {
      conversation.shift();
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<Message[]> {
    const conversation = this.conversations.get(userId) || [];
    const recentEntries = conversation.slice(-limit);
    return recentEntries.map(entry => entry.message);
  }

  /**
   * Clear conversation history for a user
   */
  async clearConversation(userId: string): Promise<void> {
    this.conversations.delete(userId);
  }

  /**
   * Clear all conversations
   */
  async clearAll(): Promise<void> {
    this.conversations.clear();
  }

  /**
   * Get all user IDs with conversations
   */
  getUserIds(): string[] {
    return Array.from(this.conversations.keys());
  }

  /**
   * Get conversation count for a user
   */
  getConversationLength(userId: string): number {
    return this.conversations.get(userId)?.length || 0;
  }
}