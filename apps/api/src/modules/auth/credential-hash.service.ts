import { BadRequestException, Injectable } from '@nestjs/common';
import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

@Injectable()
export class CredentialHashService {
  async create(secret: string): Promise<string> {
    this.assertPolicy(secret);
    const salt = randomBytes(16);
    const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
  }

  async matches(secret: string, stored: string | null): Promise<boolean> {
    if (!stored) return false;
    const [format, iterationsText, saltText, keyText] = stored.split('$');
    if (format !== FORMAT || !iterationsText || !saltText || !keyText) return false;
    const iterations = Number(iterationsText);
    if (!Number.isInteger(iterations) || iterations <= 0) return false;
    const expected = Buffer.from(keyText, 'base64url');
    const actual = await deriveKey(secret, Buffer.from(saltText, 'base64url'), iterations, expected.length, 'sha256');
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  }

  assertPolicy(secret: string): void {
    if (typeof secret !== 'string' || secret.length < MIN_LENGTH || secret.length > MAX_LENGTH) {
      throw new BadRequestException(`Secret must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`);
    }
  }
}
