import { injectable } from 'inversify';
import pino, { type Logger as PinoInstance } from 'pino';
import { type Logger } from './logger.interface.js';

@injectable()
export class PinoLogger implements Logger {
  private readonly logger: PinoInstance;

  constructor() {
    const shouldUsePretty = process.argv.includes('--pretty');

    this.logger = pino({
      level: 'info',
      transport: shouldUsePretty
        ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard'
          }
        }
        : undefined
    });
  }

  public info(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.logger.error(message, ...args);
  }
}
