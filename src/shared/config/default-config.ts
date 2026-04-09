import convict from 'convict';
import validatorFormats from 'convict-format-with-validator';
import dotenv from 'dotenv';
import { injectable } from 'inversify';
import { type AppConfig, type Config } from './config.interface.js';

convict.addFormats(validatorFormats);

@injectable()
export class DefaultConfig implements Config {
  private readonly config: convict.Config<AppConfig>;

  constructor() {
    dotenv.config();

    this.config = convict<AppConfig>({
      PORT: {
        doc: 'Port for incoming connections',
        format: 'port',
        env: 'PORT',
        default: null
      },
      DB_HOST: {
        doc: 'Database host address',
        format: 'ipaddress',
        env: 'DB_HOST',
        default: ''
      },
      DB_PORT: {
        doc: 'Database port',
        format: 'port',
        env: 'DB_PORT',
        default: 27017
      },
      DB_NAME: {
        doc: 'Database name',
        format: String,
        env: 'DB_NAME',
        default: 'six-cities'
      },
      UPLOAD_DIRECTORY: {
        doc: 'Directory for uploaded files',
        format: String,
        env: 'UPLOAD_DIRECTORY',
        default: 'upload'
      },
      SALT: {
        doc: 'Random salt for hashing',
        format: (value: string) => {
          if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error('SALT is required');
          }
        },
        env: 'SALT',
        default: ''
      }
    });

    this.config.validate({ allowed: 'strict' });
  }

  public get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this.config.get(key) as AppConfig[T];
  }
}
