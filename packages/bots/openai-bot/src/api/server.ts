import express, { Request, Response } from 'express';
import { BotManager } from '../BotManager';
import { BotConfig } from '../BotInstance';

export function createApiServer(botManager: BotManager, apiKey: string) {
  const app = express();
  app.use(express.json());

  // Middleware for API authentication
  const authenticate = (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all bot instances
  app.get('/api/bots', authenticate, (req: Request, res: Response) => {
    const status = botManager.getStatus();
    res.json(status);
  });

  // Get specific bot instance
  app.get('/api/bots/:id', authenticate, (req: Request, res: Response) => {
    const instance = botManager.getInstance(req.params.id);
    if (!instance) {
      return res.status(404).json({ error: 'Bot instance not found' });
    }
    res.json({
      id: instance.getId(),
      active: instance.isActive(),
      config: instance.getConfig()
    });
  });

  // Create new bot instance
  app.post('/api/bots', authenticate, async (req: Request, res: Response) => {
    try {
      const config: BotConfig = {
        id: req.body.id || `bot-${Date.now()}`,
        xmppUsername: req.body.xmppUsername,
        xmppPassword: req.body.xmppPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        chatroomJid: req.body.chatroomJid,
        systemPrompt: req.body.systemPrompt || 'You are a helpful AI assistant.'
      };

      // Validate required fields
      const requiredFields = ['xmppUsername', 'xmppPassword', 'firstName', 'lastName', 'chatroomJid'];
      for (const field of requiredFields) {
        if (!config[field as keyof BotConfig]) {
          return res.status(400).json({ error: `Missing required field: ${field}` });
        }
      }

      const instance = await botManager.createInstance(config);
      res.status(201).json({
        id: instance.getId(),
        active: instance.isActive(),
        config: instance.getConfig()
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Remove bot instance
  app.delete('/api/bots/:id', authenticate, async (req: Request, res: Response) => {
    try {
      await botManager.removeInstance(req.params.id);
      res.json({ message: 'Bot instance removed successfully' });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // Update bot instance (stop and recreate)
  app.put('/api/bots/:id', authenticate, async (req: Request, res: Response) => {
    try {
      // First remove the existing instance
      await botManager.removeInstance(req.params.id);

      // Create new instance with updated config
      const config: BotConfig = {
        id: req.params.id,
        xmppUsername: req.body.xmppUsername,
        xmppPassword: req.body.xmppPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        chatroomJid: req.body.chatroomJid,
        systemPrompt: req.body.systemPrompt || 'You are a helpful AI assistant.'
      };

      const instance = await botManager.createInstance(config);
      res.json({
        id: instance.getId(),
        active: instance.isActive(),
        config: instance.getConfig()
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return app;
}