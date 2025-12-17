import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

function getKey(): Buffer {
  const raw = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'Missing GITHUB_TOKEN_ENCRYPTION_KEY (expected 32-byte base64).',
    );
  }

  let key: Buffer;
  try {
    key = Buffer.from(raw, 'base64');
  } catch {
    throw new Error(
      'Invalid GITHUB_TOKEN_ENCRYPTION_KEY (expected base64-encoded bytes).',
    );
  }
  console.log('key length:', key);
  if (key.length !== 32) {
    throw new Error(
      `Invalid GITHUB_TOKEN_ENCRYPTION_KEY length: ${key.length} (expected 32 bytes).`,
    );
  }

  return key;
}

export type EncryptedToken = {
  tokenCiphertext: string;
  tokenIv: string;
  tokenTag: string;
};

export function encryptToken(token: string): EncryptedToken {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    tokenCiphertext: ciphertext.toString('base64'),
    tokenIv: iv.toString('base64'),
    tokenTag: tag.toString('base64'),
  };
}

export function decryptToken(payload: EncryptedToken): string {
  const key = getKey();
  const iv = Buffer.from(payload.tokenIv, 'base64');
  const tag = Buffer.from(payload.tokenTag, 'base64');
  const ciphertext = Buffer.from(payload.tokenCiphertext, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
