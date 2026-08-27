import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hash(password, {
      algorithm: 2, // Argon2id (const enum unusable with isolatedModules)
      memoryCost: 19456, // 19 MiB per thread (OWASP minimum)
      timeCost: 2,
      parallelism: 1,
    });
  }

  verify(hashed: string, password: string): Promise<boolean> {
    return verify(hashed, password);
  }
}
