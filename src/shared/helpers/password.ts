import {createHmac, timingSafeEqual} from 'node:crypto';

export const createPasswordHash = (password: string, salt: string): string =>
  createHmac('sha256', salt).update(password).digest('hex');

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const passwordHash = createPasswordHash(password, salt);
  const expected = Buffer.from(hash);
  const actual = Buffer.from(passwordHash);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
