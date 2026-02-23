export interface Logger {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
