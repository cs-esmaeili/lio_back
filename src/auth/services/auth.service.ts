import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private sessions: SessionService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    if (user.status !== UserStatus.ACTIVE) return null;
    if (!user.passwordHash) return null;

    const ok = await this.passwordService.verify(user.passwordHash, pass);
    if (!ok) return null;

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async changePassword(userId: number, newPassword: string, sessionId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.usersService.setPassword(userId, passwordHash);
    await this.sessions.revokeAllForUserExcept(userId, sessionId);
  }
}
