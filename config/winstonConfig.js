import winston, { createLogger, format } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const cloudWatchTransport = new WinstonCloudWatch({
  level: 'info',
  logGroupName: 'BlogApi',
  logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
  awsRegion: process.env.AWS_REGION,
  messageFormatter: ({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
  },
});

cloudWatchTransport.on('error', (err) => {
  console.error('Error in CloudWatch transport:', err);
});

// Configure Winston with CloudWatch transport
const logger = createLogger({
  level: 'info', // Minimum logging level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    // Console transport for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    cloudWatchTransport,
  ],
});

export default logger;
