import winston from 'winston';

// Configure logger with custom format
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/test-bot.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
}); 