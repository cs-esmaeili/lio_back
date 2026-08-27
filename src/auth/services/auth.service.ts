import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PasswordService } from './password.service';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findByPhone(phone);
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
}
