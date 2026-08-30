import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createByUsername(username: string) {
    return this.prisma.user.create({ data: { username } });
  }

  setPassword(userId: number, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
